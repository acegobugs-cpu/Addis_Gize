package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"app/internal/infra/database"
	"app/internal/infra/search"
	"app/internal/pkg/config" // Adjust to your actual config package path
	"app/internal/workers"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run cmd/cli/main.go [command]\nCommands:\n  reindex - Re-indexes all PostgreSQL articles into Elasticsearch")
	}

	command := os.Args[1]

	ctx := context.Background()
	cfg, err := config.Load("configs/config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.NewPostgres(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close(ctx)

	es, err := search.NewElasticSearch(cfg.ElasticSearch.Addresses)
	if err != nil {
		log.Fatalf("Failed to connect to Elasticsearch: %v", err)
	}

	switch command {
	case "reindex":
		log.Println("Starting full Elasticsearch re-index from PostgreSQL...")
		if err := ReindexAllArticles(ctx, db.Pool(), es); err != nil {
			log.Fatalf("Re-index failed: %v", err)
		}
	default:
		log.Fatalf("Unknown command: %s", command)
	}
}

func ReindexAllArticles(ctx context.Context, pool *pgxpool.Pool, es *search.ElasticSearch) error {
	rows, err := pool.Query(ctx, `
        SELECT article_id, locale, title, slug, description, content::text, published_at
        FROM article_locale
    `)
	if err != nil {
		return err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var doc search.ArticleDocument
		var createdAt time.Time
		var contentJSON string

		if err := rows.Scan(&doc.ArticleID, &doc.Locale, &doc.Title, &doc.Slug, &doc.Description, &contentJSON, &createdAt); err != nil {
			return err
		}

		doc.ID = fmt.Sprintf("%s_%s", doc.ArticleID, doc.Locale)
		doc.ContentText = workers.ExtractTextFromTiptap(contentJSON) // 👈 2. Call exported function
		doc.CreatedAt = createdAt.Format(time.RFC3339)

		if err := es.IndexArticle(ctx, doc); err != nil {
			log.Printf("Failed to index article %s: %v", doc.ID, err)
		} else {
			count++
		}
	}

	log.Printf("🎉 Successfully re-indexed %d article locales into Elasticsearch!", count)
	return nil
}
