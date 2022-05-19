package main

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const dbUri = "mongodb://localhost:27017"
const dbName = "decision-engine"

var dbClient *mongo.Client

func OpenDatabase() error {
	ctx := context.Background()
	opts := options.Client().ApplyURI(dbUri)
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
