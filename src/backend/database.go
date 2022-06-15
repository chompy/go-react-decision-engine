package main

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const dbFetchLimit = 25

var dbClient *mongo.Client
var dbName string

func databaseOpen(config *Config) error {
	opts := options.Client().ApplyURI(config.DatabaseURI)
	var err error
	dbClient, err = mongo.Connect(databaseContext(), opts)
	dbName = config.DatabaseName
	return err
}

func databaseClose() error {
	if dbClient != nil {
		return dbClient.Disconnect(databaseContext())
	}
	return nil
}

func databaseCollectionFromData(data interface{}) (*mongo.Collection, error) {
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

func databaseContext() context.Context {
	return context.Background()
}
