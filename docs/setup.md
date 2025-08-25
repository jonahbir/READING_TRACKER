mkdir -p ../docs
cat <<EOL > ../docs/setup.md
# Setup Instructions

## Prerequisites
- Go 1.20+ (check: \`go version\`)
- MongoDB (Docker or Atlas)
- Docker (optional)

## Backend Setup
1. Navigate to \`backend/\`.
2. Run \`go mod init github.com/yourusername/reading-tracker\`.
3. Install dependencies: \`go get github.com/gorilla/mux go.mongodb.org/mongo-driver/mongo golang.org/x/crypto/bcrypt github.com/joho/godotenv\`.
4. Create \`.env\` with \`MONGO_URI\`, \`DB_NAME\`, \`PORT\`.
5. Run \`go run main.go\`.

## MongoDB
- Local: \`docker run -d -p 27017:27017 --name mongodb mongo:latest\`
- Atlas: Use connection string from your cluster.
EOL