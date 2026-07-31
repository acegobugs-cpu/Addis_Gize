package search

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/esapi"
)

const IndexName = "articles"

type ArticleDocument struct {
	ID          string `json:"id"`
	ArticleID   string `json:"article_id"`
	Locale      string `json:"locale"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	ContentText string `json:"content_text"` // Plain text stripped from Tiptap JSON
	CreatedAt   string `json:"created_at"`
}

type ElasticSearch struct {
	Client *elasticsearch.Client // Capitalized so application layer can access it
}

func NewElasticSearch(addresses []string) (*ElasticSearch, error) {
	cfg := elasticsearch.Config{
		Addresses: addresses,
	}
	client, err := elasticsearch.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create Elasticsearch client: %w", err)
	}

	svc := &ElasticSearch{Client: client}
	if err := svc.InitIndex(context.Background()); err != nil {
		return nil, err
	}

	return svc, nil
}

// InitIndex creates the index with settings optimized for multi-language news searching
func (s *ElasticSearch) InitIndex(ctx context.Context) error {
	res, err := s.Client.Indices.Exists([]string{IndexName})
	if err != nil {
		return err
	}
	if res.StatusCode == 200 {
		return nil // Index already exists
	}

	// Schema mapping with edge_ngram for instant search & autocomplete
	mapping := `{
		"settings": {
			"analysis": {
				"analyzer": {
					"news_analyzer": {
						"type": "custom",
						"tokenizer": "standard",
						"filter": ["lowercase", "asciifolding"]
					}
				}
			}
		},
		"mappings": {
			"properties": {
				"id": { "type": "keyword" },
				"article_id": { "type": "keyword" },
				"locale": { "type": "keyword" },
				"title": { 
					"type": "text", 
					"analyzer": "news_analyzer",
					"fields": { "keyword": { "type": "keyword" } }
				},
				"slug": { "type": "keyword" },
				"description": { "type": "text", "analyzer": "news_analyzer" },
				"content_text": { "type": "text", "analyzer": "news_analyzer" },
				"created_at": { "type": "date" }
			}
		}
	}`

	req := esapi.IndicesCreateRequest{
		Index: IndexName,
		Body:  strings.NewReader(mapping),
	}

	res, err = req.Do(ctx, s.Client)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("error creating index: %s", res.String())
	}

	log.Println("✅ Elasticsearch 'articles' index initialized successfully!")
	return nil
}

// IndexArticle adds or updates an article document in Elasticsearch
func (s *ElasticSearch) IndexArticle(ctx context.Context, doc ArticleDocument) error {
	data, err := json.Marshal(doc)
	if err != nil {
		return err
	}

	req := esapi.IndexRequest{
		Index:      IndexName,
		DocumentID: doc.ID, // Unique per locale (article_id + locale)
		Body:       bytes.NewReader(data),
		Refresh:    "true",
	}

	res, err := req.Do(ctx, s.Client)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("failed to index document: %s", res.String())
	}

	return nil
}
