# Start from the latest golang base image
FROM golang:bookworm as builder

# Set the Current Working Directory inside the container
WORKDIR /go/src/app

# Copy the Go Module files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container
COPY main.go ./

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

######## Start a new stage from scratch #######
FROM alpine:3.19.1

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /go/src/app/main .

# Command to run the executable
CMD ["./main"]
