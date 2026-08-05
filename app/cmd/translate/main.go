package main

import (
	"context"
	"log"

	"github.com/sashabaranov/go-openai"
	"go.uber.org/zap"

	"app/internal/infra/database"
	"app/internal/infra/search"
	"app/internal/pkg/config"
	"app/internal/pkg/logger"
	"app/internal/workers"
)

func main() {
	ctx := context.Background()

	// 1. Load config & initialize database
	cfg, err := config.Load("configs/config.docker.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	pg, err := database.NewPostgres(&cfg.Database)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer pg.Close(ctx)

	// 2. Configure OpenAI SDK to point to Gemini's free endpoint
	geminiAPIKey := cfg.AI.OpenAI_API_Key // Or get it from cfg.GeminiAPIKey
	if geminiAPIKey == "" {
		log.Fatal("GEMINI_API_KEY environment variable is missing")
	}

	clientConfig := openai.DefaultConfig(geminiAPIKey)
	clientConfig.BaseURL = "https://api.groq.com/openai/v1"

	aiClient := openai.NewClientWithConfig(clientConfig)

	es, err := search.NewElasticSearch(cfg.ElasticSearch.Addresses) // Pass ES config host URLs!
	if err != nil {
		logger.Fatal("Failed to initialize Elastic Search", zap.Error(err)) // Stop app if search fails to start
	}

	// 3. Initialize and run translation worker
	worker := workers.NewTranslationWorker(pg.Pool(), aiClient, es)

	log.Println("🚀 Starting Translation Worker (using Gemini)...")
	if err := worker.Run(ctx); err != nil {
		log.Fatalf("Worker execution failed: %v", err)
	}

	log.Println("\n✨ Translation job completed successfully!")
}
