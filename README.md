# 🚀 NexaGen - Next Generation AI Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-orange.svg)](https://fastapi.tiangolo.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

A comprehensive AI-powered platform that brings together multiple intelligent tools and services in a unified, user-friendly interface. NexaGen empowers users with advanced AI capabilities including conversational chatbots, content summarization, course generation, database querying, flowchart creation, and more.

## ✨ Key Features

### 🤖 AI Chatbot
- Multi-model support (Gemini, Llama, Groq)
- User authentication and session management
- Chat history with persistent storage
- Context-aware conversations with memory

### 📝 Content Summarizer
- Summarize web pages and YouTube videos
- AI-powered blog generation from summaries
- Multi-language support
- Export summaries and blogs

### 🎭 Character Chat System
- Create and interact with AI personas
- Custom character creation with tones
- Persistent character conversations
- User management for personas

### 📚 Course Generator
- AI-driven course content creation
- Comprehensive curriculum design with skills analysis
- Market research and industry trends integration
- Interactive quizzes and assessments (30 questions per course)
- Learning pathway recommendations with career guidance
- Multi-agent system using CrewAI for specialized content creation

### 🗄️ Database Chat
- Natural language database querying
- SQL agent integration
- Support for MySQL databases
- Intelligent query generation

### 📊 Flowchart Maker
- Generate flowcharts from natural language
- AI-powered logic visualization
- Interactive flowchart display
- Code-to-flowchart conversion

### 🎨 Image Generator
- AI-powered image generation
- Integration with Bytez API
- Custom prompt-based creation

## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance async web framework
- **SQLAlchemy** - Database ORM
- **LangChain** - LLM framework integration
- **CrewAI** - Multi-agent AI orchestration
- **Google Gemini** - Primary LLM provider
- **Groq** - Alternative LLM provider

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Prisma** - Database toolkit
- **Socket.io** - Real-time communication

### AI & ML
- **LangChain** - LLM application framework
- **CrewAI** - AI agent orchestration
- **PyFlowchart** - Flowchart generation
- **Bytez** - Image generation API

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- MySQL (for database features)
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd NexaGen
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# AI API Keys
GEMINI_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
BYTEZ_API_KEY=your_bytez_api_key
RAPIDAPI_KEY=your_rapidapi_key

# Database
MYSQL_HOST=localhost
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DB=your_database

# Security
SECRET_KEY=your_secret_key
```

4. **Run Backend Services**
```bash
# Chatbot Service
cd Backend/Chatbot
uvicorn main:app --host 0.0.0.0 --port 8000

# Summarizer Service
cd Backend/Summarizer/backend
uvicorn main:app --host 0.0.0.0 --port 8001

# Persona Flow Service
cd Backend/Persona_Flow/backend
uvicorn main:app --host 0.0.0.0 --port 8002

# Flowchart Maker
cd Backend/flowchart_maker/mycode
uvicorn main:app --host 0.0.0.0 --port 8003

# Course Generator Service
cd Backend/course_gen/backend
uvicorn main:app --host 0.0.0.0 --port 8004

# Database Chat Service
cd Backend/DB_Chat
uvicorn main:app --host 0.0.0.0 --port 8005

# Image_Generator Service
cd Backend/Image\ Generator
python image_generator.py
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend/course+summ+character+db
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create `.env.local`:
```env
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your_database_url
```

4. **Run development server**
```bash
npm run dev
```

5. **Access the application**
Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Usage Examples

### AI Chatbot
```python
# Example API call to chatbot
import requests

response = requests.post("http://localhost:8000/ask", json={
    "question": "Explain quantum computing",
    "engine": "gemini-2.0-flash",
    "use_history": True
})
```

### Content Summarizer
```python
# Summarize a web page
response = requests.get("http://localhost:8001/summarize/web", params={
    "url": "https://example.com/article"
})
```

### Character Chat
```python
# Create and chat with a character
response = requests.post("http://localhost:8002/set_character/", data={
    "username": "user123",
    "mode": "auto",
    "character_name": "Einstein",
    "tone": "wise"
})
```

### Course Generator
```python
# Generate a complete course
response = requests.post("http://localhost:8004/generate/course", json={
    "course": "Machine Learning"
})
```

### Database Chat
```python
# Query database with natural language
response = requests.post("http://localhost:8005/chat", json={
    "query": "Show me all users who joined this month",
    "mysql_host": "localhost",
    "mysql_user": "root",
    "mysql_password": "password",
    "mysql_db": "mydatabase"
})
```

### Flowchart Maker
```python
# Generate flowchart from natural language
response = requests.post("http://localhost:8003/generate", json={
    "query": "if user age > 18 then eligible else not eligible"
})
```

## 🔧 API Documentation

### 🤖 Chatbot API (`/Backend/Chatbot`)
- `GET /` - Service health check
- `POST /register` - User registration with username/password
- `POST /token` - User authentication and JWT token generation
- `POST /ask` - Send chat message with AI model selection
- `GET /history` - Retrieve user's chat history
- `GET /models` - List available AI models

### 📝 Summarizer API (`/Backend/Summarizer/backend`)
- `GET /` - Service health check
- `GET /summarize/web` - Summarize web page content
  - Parameters: `url` (required)
- `GET /summarize/youtube` - Summarize YouTube video transcript
  - Parameters: `url` (required), `lang` (optional, default: "en")
- `GET /generate-blog/web` - Generate blog post from web summary
  - Parameters: `url` (required), `summary` (optional)
- `GET /generate-blog/youtube` - Generate blog post from YouTube summary
  - Parameters: `url` (required), `lang` (optional), `summary` (optional)

### 🎭 Persona Flow API (`/Backend/Persona_Flow/backend`)
- `GET /health` - Service health check
- `GET /get_user_id/{username}` - Get user ID by username
- `POST /set_character/` - Create new AI character persona
  - Form data: `username`, `mode` ("auto"/"custom"), `character_name`, `custom_prompt` (for custom mode), `tone`
- `GET /user/{user_id}/characters` - List all characters for a user
- `POST /chat/` - Chat with a specific character
  - Form data: `user_id`, `persona_id`, `user_message`, `max_history` (optional)
- `GET /history/{user_id}/{persona_id}` - Get chat history for a character
- `DELETE /character/{persona_id}` - Delete a character and its messages
  - Form data: `user_id`

### 📚 Course Generator API (`/Backend/course_gen/backend`)
- `GET /` - Service health check
- `POST /generate/course` - Generate complete course curriculum
  - Request body: `{"course": "Course Name"}`
  - Returns: skills analysis, content, and quiz questions

### 🗄️ Database Chat API (`/Backend/DB_Chat`)
- `GET /` - Service health check
- `POST /chat` - Natural language database queries
  - Request body: `{"query": "natural language query", "mysql_host": "...", "mysql_user": "...", "mysql_password": "...", "mysql_db": "...", "mysql_port": "3306"}`

### 📊 Flowchart Maker API (`/Backend/flowchart_maker/mycode`)
- `GET /` - API information and available endpoints
- `GET /health` - Service health check
- `POST /generate` - Generate flowchart from natural language
  - Request body: `{"query": "flowchart description"}`
- `GET /flowchart/{flowchart_id}` - View generated flowchart (HTML)
- `GET /download/{flowchart_id}` - Download flowchart as HTML file

### 🎨 Image Generator API (`/Backend/Image Generator`)
- Script-based service using Bytez API
- Run: `python image_generator.py`
- Generates images from text prompts using Stable Diffusion XL

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Write comprehensive tests
- Update documentation for new features
- Ensure all tests pass before submitting PR

## 📞 Support & Help

### Getting Help
- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions on GitHub
- **Email**: Contact maintainers at [sachingoyal9274@gmail.com]

### Common Issues
- **API Connection Issues**: Ensure all backend services are running
- **Environment Variables**: Double-check your `.env` file configuration
- **Dependencies**: Run `pip install -r requirements.txt` for backend

## 👥 Maintainers

- **Project Lead**: [@SachinGoyal94](https://github.com/SachinGoyal94) 
- **Backend Team**: [@SachinGoyal94](https://github.com/SachinGoyal94), [@raghav-1411](https://github.com/raghav-1411)
- **Frontend Team**: [@itzzpriyal](https://github.com/itzzpriyal), [@vrindachhabra](https://github.com/vrindachhabra)
- **AI/ML Team**: [@SachinGoyal94](https://github.com/SachinGoyal94)

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │◄──►│   Services      │◄──►│   (Gemini,      │
│                 │    │   (FastAPI)     │    │    Groq, etc.)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   External APIs │    │   File Storage  │
│   (MySQL)       │    │   (Bytez,       │    │   (Generated    │
│                 │    │    RapidAPI)    │    │    Images/HTML) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Ports
- **Chatbot Service**: Port 8000
- **Summarizer Service**: Port 8001
- **Persona Flow Service**: Port 8002
- **Flowchart Maker**: Port 8003
- **Course Generator**: Port 8004
- **Database Chat**: Port 8005
- **Frontend**: Port 3000

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run all services
docker-compose up --build

# Run specific service
docker-compose up chatbot-service
```

### Cloud Deployment
- **AWS**: Deploy to ECS/EKS with ALB
- **Google Cloud**: Use Cloud Run or GKE
- **Azure**: Deploy to AKS with Application Gateway

### Environment Variables for Production
```env
# Production settings
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://yourdomain.com
DATABASE_URL=mysql://user:pass@host:port/db
REDIS_URL=redis://host:port
```

## 📊 Performance & Monitoring

### Key Metrics
- **Response Time**: <2s for most endpoints
- **Throughput**: 100+ requests/minute per service
- **Availability**: 99.5% uptime target
- **Error Rate**: <1% error rate

### Monitoring Setup
```bash
# Health checks
curl http://localhost:8000/health
curl http://localhost:8001/health

# Metrics endpoint (if implemented)
curl http://localhost:8000/metrics
```

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication for user sessions
- API key authentication for external integrations
- Role-based access control (RBAC)

### Data Protection
- All data encrypted in transit (HTTPS/TLS 1.3)
- Sensitive data encrypted at rest
- Regular security audits and dependency updates

### API Security
- Rate limiting (100 requests/minute per IP)
- Input validation and sanitization
- CORS configuration for allowed origins

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Backend Service Won't Start
```bash
# Check if port is available
netstat -tulpn | grep :8000

# Check environment variables
echo $GEMINI_KEY

# Check logs
tail -f logs/backend.log
```

#### Database Connection Issues
```bash
# Test MySQL connection
mysql -h localhost -u user -p dbname -e "SELECT 1"

# Check connection string
mysql://user:pass@host:port/db
```

#### AI Service Errors
```bash
# Check API key validity
curl -H "Authorization: Bearer $GEMINI_KEY" \
     https://generativelanguage.googleapis.com/v1/models

# Verify quota limits
# Check API dashboard for usage
```

#### Frontend Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```



## 📄 License

This project is licensed under the MIT License 

---

**Built with ❤️ using cutting-edge AI technologies**

*Empowering the future with intelligent automation and conversational AI*
