package main

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const dbFetchLimit = 25

var dbClient *mongo.Client
var dbName string

func DatabaseOpen(config *Config) error {
	ctx := context.Background()
	opts := options.Client().ApplyURI(config.DatabaseURI)
	var err error
	dbClient, err = mongo.Connect(ctx, opts)
	dbName = config.DatabaseName
	return err
}

func DatabaseClose() error {
	if dbClient != nil {
		ctx := context.Background()
		return dbClient.Disconnect(ctx)
	}
	return nil
}

func DatabaseCollectionFromData(data interface{}) (*mongo.Collection, error) {
	if data == nil {
		return nil, ErrNoData
	}
	if dbClient == nil || dbName == "" {
		return nil, ErrNoDBConnection
	}
	collectionName := getDatabaseCollectionNameFromData(data)
	if collectionName == "" {
		return nil, ErrDBInvalidObjectType
	}
	return dbClient.Database(dbName).Collection(collectionName), nil
}
