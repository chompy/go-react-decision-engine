package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

type BatchResponseWriter struct {
	StatusCode int
	Body       *bytes.Reader
	Response   *HTTPMessage
	header     http.Header
}

func NewBatchResponseWriter() BatchResponseWriter {
	return BatchResponseWriter{
		header:   make(http.Header),
		Body:     &bytes.Reader{},
		Response: &HTTPMessage{},
	}
}

func (w BatchResponseWriter) Header() http.Header {
	return w.header
}

func (w BatchResponseWriter) Write(data []byte) (int, error) {
	w.Body.Reset(data)
	w.Response.Success = false
	w.Response.Message = ""
	w.Response.Data = nil
	if err := json.Unmarshal(data, w.Response); err != nil {
		return 0, err
	}
	return len(data), nil
}

func (w BatchResponseWriter) WriteHeader(statusCode int) {
	w.StatusCode = statusCode
}

type HTTPBatchPayload struct {
	Path    string      `json:"path"`
	Payload interface{} `json:"payload"`
}

func HTTPBatch(w http.ResponseWriter, r *http.Request) {

	// parse payload
	requests := []HTTPBatchPayload{}
	if err := HTTPReadPayload(r, &requests); err != nil {
		HTTPSendError(w, err)
		return
	}
	// itterate all requests in batch
	out := make([]HTTPMessage, 0)
	for _, req := range requests {
		hasEndpoint := false
		for _, endpoint := range httpEndpoints {
			if endpoint.Path == req.Path {
				hasEndpoint = true
				method := strings.Split(endpoint.Methods, ",")[0]
				// generate url w/ query string
				rawUrl := endpoint.Path
				if method == "GET" {
					queryStr := ""
					if req.Payload != nil {
						for k, v := range req.Payload.(map[string]interface{}) {
							queryStr += fmt.Sprintf("&%s=%s", k, v)
						}
						queryStr = strings.TrimLeft(queryStr, "&")
					}
					rawUrl += "?" + queryStr
				}
				// build request
				subReq, err := http.NewRequest(method, rawUrl, nil)
				if err != nil {
					out = append(out, HTTPMessage{Success: false, Message: err.Error()})
					break
				}
				if method == "POST" {
					rawPayload, err := json.Marshal(req.Payload)
					if err != nil {
						out = append(out, HTTPMessage{Success: false, Message: err.Error()})
						break
					}
					subReq, err = http.NewRequest(method, rawUrl, bytes.NewReader(rawPayload))
					if err != nil {
						out = append(out, HTTPMessage{Success: false, Message: err.Error()})
						break
					}
				}
				for _, c := range r.Cookies() {
					subReq.AddCookie(c)
				}
				// send request
				w := NewBatchResponseWriter()
				endpoint.Function(w, subReq)
				// read response
				rawResp, err := ioutil.ReadAll(w.Body)
				if err != nil {
					out = append(out, HTTPMessage{Success: false, Message: err.Error()})
					break
				}
				resp := HTTPMessage{}
				if err := json.Unmarshal(rawResp, &resp); err != nil {
					out = append(out, HTTPMessage{Success: false, Message: err.Error()})
					break
				}
				out = append(out, resp)
				break
			}
		}
		if !hasEndpoint {
			out = append(out, HTTPMessage{
				Success: false,
				Message: "Endpoint not found.",
			})
		}
	}

	HTTPSendMessage(w, &HTTPMessage{
		Success: true,
		Count:   len(out),
		Data:    out,
	}, http.StatusOK)

}
