package main

import (
	"context"
	"log"

	"github.com/sashabaranov/go-openai"

	"app/internal/infra/database"
	"app/internal/pkg/config"
	"app/internal/workers"
)

func main() {
	ctx := context.Background()

	// 1. Load config & initialize database
	cfg, err := config.Load("configs/config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	pg, err := database.NewPostgres(&cfg.Database)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer pg.Close(ctx)

	// 2. Configure OpenAI SDK to point to Gemini's free endpoint
	geminiAPIKey := "Open_api_key" // Or get it from cfg.GeminiAPIKey
	if geminiAPIKey == "" {
		log.Fatal("GEMINI_API_KEY environment variable is missing")
	}

	clientConfig := openai.DefaultConfig(geminiAPIKey)
	clientConfig.BaseURL = "https://api.groq.com/openai/v1"

	aiClient := openai.NewClientWithConfig(clientConfig)

	// 3. Initialize and run translation worker
	worker := workers.NewTranslationWorker(pg.Pool(), aiClient)

	log.Println("🚀 Starting Translation Worker (using Gemini)...")
	if err := worker.Run(ctx); err != nil {
		log.Fatalf("Worker execution failed: %v", err)
	}

	log.Println("\n✨ Translation job completed successfully!")
}
