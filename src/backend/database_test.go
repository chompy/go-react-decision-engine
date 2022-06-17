package main

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
)

func testGetConfig() *Config {
	return &Config{
		DatabaseURI:  "mongodb://localhost:27017",
		DatabaseName: "ccde_testing",
	}
}

func testCleanDatabase() error {
	dataTypes := []interface{}{TreeRoot{}, TreeVersion{}, FormSubmission{}, User{}, Team{}}
	for _, dataType := range dataTypes {
		nodeTopCol, err := databaseCollectionFromData(dataType)
		if err != nil {
			return err
		}
		_, err = nodeTopCol.DeleteMany(context.Background(), bson.D{})
		if err != nil {
			return err
		}
	}
	return nil
}
