package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type MockResponseWriter struct {
	StatusCode *int
	Body       *bytes.Reader
	Response   *HTTPMessage
	header     http.Header
}

func NewMockResponseWriter() MockResponseWriter {
	return MockResponseWriter{
		header:   make(http.Header),
		Body:     &bytes.Reader{},
		Response: &HTTPMessage{},
	}
}

func (w MockResponseWriter) Header() http.Header {
	return w.header
}

func (w MockResponseWriter) Write(data []byte) (int, error) {
	w.Body.Reset(data)
	w.Response.Success = false
	w.Response.Message = ""
	w.Response.Data = nil
	if err := json.Unmarshal(data, w.Response); err != nil {
		return 0, err
	}
	return len(data), nil
}

func (w MockResponseWriter) WriteHeader(statusCode int) {
	*w.StatusCode = statusCode
}
