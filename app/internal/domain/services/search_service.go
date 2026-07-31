package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"app/internal/infra/search"
)

type SearchService struct {
	es *search.ElasticSearch // Corrected struct type
}

func NewSearchService(es *search.ElasticSearch) *SearchService {
	return &SearchService{
		es: es,
	}
}

type SearchHit struct {
	ArticleID   uuid.UUID           `json:"article_id"`
	Locale      string              `json:"locale"`
	Title       string              `json:"title"`
	Slug        string              `json:"slug"`
	Description string              `json:"description"`
	Highlights  map[string][]string `json:"highlights,omitempty"`
}

func (s *SearchService) Search(ctx context.Context, locale, query string, from, size int) ([]SearchHit, error) {
	// Build Elasticsearch Query DSL
	mustClause := map[string]interface{}{
		"multi_match": map[string]interface{}{
			"query":     query,
			"fields":    []string{"title^3", "description^2", "content_text"}, // Title boost (3x)
			"fuzziness": "AUTO",                                               // Handles typos automatically!
		},
	}

	filterClause := []map[string]interface{}{}
	if locale != "" {
		filterClause = append(filterClause, map[string]interface{}{
			"term": map[string]string{"locale": locale},
		})
	}

	esQuery := map[string]interface{}{
		"from": from,
		"size": size,
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must":   mustClause,
				"filter": filterClause,
			},
		},
		"highlight": map[string]interface{}{
			"fields": map[string]interface{}{
				"title":        map[string]interface{}{},
				"content_text": map[string]interface{}{"fragment_size": 150, "number_of_fragments": 1},
			},
		},
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(esQuery); err != nil {
		return nil, err
	}

	// Access s.es.Client
	res, err := s.es.Client.Search(
		s.es.Client.Search.WithContext(ctx),
		s.es.Client.Search.WithIndex(search.IndexName),
		s.es.Client.Search.WithBody(&buf),
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("search request failed: %s", res.String())
	}

	var esResponse struct {
		Hits struct {
			Hits []struct {
				Source    search.ArticleDocument `json:"_source"`
				Highlight map[string][]string    `json:"highlight"`
			} `json:"hits"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(res.Body).Decode(&esResponse); err != nil {
		return nil, err
	}

	var results []SearchHit
	for _, hit := range esResponse.Hits.Hits {
		artUUID, _ := uuid.Parse(hit.Source.ArticleID)
		results = append(results, SearchHit{
			ArticleID:   artUUID,
			Locale:      hit.Source.Locale,
			Title:       hit.Source.Title,
			Slug:        hit.Source.Slug,
			Description: hit.Source.Description,
			Highlights:  hit.Highlight,
		})
	}

	return results, nil
}
