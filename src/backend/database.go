package main

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var dbClient *mongo.Client

func OpenDatabase(config *Config) error {
	ctx := context.Background()
	opts := options.Client().ApplyURI(config.DatabaseURI)
	var err error
	dbClient, err = mongo.Connect(ctx, opts)
	return err
}

func CloseDatabase() error {
	if dbClient != nil {
		ctx := context.Background()
		return dbClient.Disconnect(ctx)
	}
	return nil
}
