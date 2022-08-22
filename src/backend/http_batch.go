package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

type BatchResponseWriter struct {
	StatusCode *int
	Body       *bytes.Reader
	Response   *HTTPMessage
	header     http.Header
}

func NewBatchResponseWriter() BatchResponseWriter {
	return BatchResponseWriter{
		StatusCode: new(int),
		header:     make(http.Header),
		Body:       &bytes.Reader{},
		Response:   &HTTPMessage{},
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
	*w.StatusCode = statusCode
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
	out := make([]HTTPMessage, 0)
	// replace parameters in payload to allow subsequent calls to use
	// values from previous call
	replVal := func(rv string) string {
		if !strings.Contains(rv, "$") {
			return rv
		}
		for i := range out {
			if out[i].Data == nil {
				continue
			}
			for k, v := range out[i].Data.(map[string]interface{}) {
				k = fmt.Sprintf("$%d.%s", i+1, k)
				switch v := v.(type) {
				case string:
					{
						rv = strings.ReplaceAll(rv, k, v)
						break
					}
				case float64:
					{
						rv = strings.ReplaceAll(rv, k, fmt.Sprintf("%d", int(v)))
						break
					}
				case int:
					{
						rv = strings.ReplaceAll(rv, k, fmt.Sprintf("%d", v))
						break
					}
				}
			}
		}
		return rv
	}
	// itterate all requests in batch
	for _, req := range requests {
		hasEndpoint := false
		for _, endpoint := range httpEndpoints {
			if endpoint.Path == req.Path {
				hasEndpoint = true
				method := strings.Split(endpoint.Methods, ",")[0]
				// process value replaces on payload
				switch p := req.Payload.(type) {
				case map[string]interface{}:
					{
						for k, v := range p {
							switch v := v.(type) {
							case string:
								{
									p[k] = replVal(v)
									num, err := strconv.Atoi(p[k].(string))
									if err == nil {
										p[k] = num
									}
								}
							}
						}
						break
					}
				}
				// generate url w/ query string
				rawUrl := endpoint.Path
				if method == "GET" {
					queryStr := ""
					if req.Payload != nil {
						for k, v := range req.Payload.(map[string]interface{}) {
							switch v := v.(type) {
							case float64:
								{
									queryStr += fmt.Sprintf("&%s=%d", k, int(v))
									break
								}
							case string:
								{
									queryStr += fmt.Sprintf("&%s=%s", k, v)
									break
								}
							case bool:
								{
									queryStr += fmt.Sprintf("&%s=%t", k, v)
									break
								}
							}

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
				rawResp, err := io.ReadAll(w.Body)
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
