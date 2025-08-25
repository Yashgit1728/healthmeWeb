# API Optimization Guide

## 🚀 Overview
This document outlines the comprehensive optimizations implemented in the HealthMe API to improve performance, security, and user experience.

## 📊 Performance Optimizations

### 1. Response Compression
- **Middleware**: `compression()`
- **Benefit**: Reduces response size by 30-70% for text-based responses
- **Implementation**: Automatically compresses JSON responses

### 2. Response Caching
- **Reflections Cache**: 5-minute TTL for user reflections
- **Stats Cache**: 10-minute TTL for user statistics
- **Benefit**: Reduces database queries and improves response times
- **Cache Invalidation**: Automatic invalidation on data updates

### 3. Database Query Optimization
- **Parallel Operations**: Message storage and reflection creation run concurrently
- **Query Limiting**: Recent messages limited to last 6 for context
- **Performance Monitoring**: Logs slow queries (>500ms for reflections, >1000ms for stats)

### 4. Request/Response Optimization
- **Request Size Limits**: 10MB maximum payload size
- **Response Headers**: Cache control, security headers, performance metrics
- **Input Sanitization**: Automatic trimming and validation

## 🔒 Security Enhancements

### 1. Rate Limiting
- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **AI Endpoint Limit**: 20 requests per 15 minutes per IP (stricter)
- **User Rate Limit**: 100 requests per 15 minutes per authenticated user
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### 2. Security Headers
- **Helmet.js**: Comprehensive security headers
- **CORS**: Configurable origins (development vs production)
- **Content Security Policy**: Configurable for development

### 3. Input Validation
- **Zod Schemas**: Type-safe validation with detailed error messages
- **Request Sanitization**: Automatic trimming and normalization
- **Size Validation**: Prevents oversized payloads

## 📈 Monitoring & Analytics

### 1. Performance Metrics
- **Response Time Tracking**: High-precision timing using `process.hrtime.bigint()`
- **Slow Request Detection**: Automatic logging of requests >1000ms
- **Fast Request Logging**: Identifies potential caching opportunities (<50ms)

### 2. Error Tracking
- **Structured Error Responses**: Consistent error format with error codes
- **Retry-After Headers**: Tells clients when to retry failed requests
- **Development vs Production**: Different error detail levels

### 3. Request Logging
- **Method, Path, Status**: Basic request information
- **Performance Metrics**: Response time for each request
- **User Context**: User ID for authenticated requests

## 🗄️ Caching Strategy

### 1. In-Memory Cache
```typescript
// Cache structure
const reflectionsCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Cache key format: userId:endpoint
const cacheKey = `${userId}:${req.originalUrl}`;
```

### 2. Cache Invalidation
- **Automatic**: On data updates (POST requests)
- **Manual**: Via `/stats/clear-cache` endpoint
- **TTL-based**: Automatic expiration after configured time

### 3. Cache Headers
- **GET Requests**: `Cache-Control: private, max-age=300`
- **Performance**: `X-Response-Time`, `X-Content-Type-Options`

## 🔄 Error Handling

### 1. Error Response Format
```typescript
{
  error: 'Error message',
  code: 'ERROR_CODE',
  details: 'Additional information',
  retryAfter: 'When to retry',
  timestamp: 'ISO timestamp'
}
```

### 2. Error Codes
- `AUTH_REQUIRED`: Authentication needed
- `VALIDATION_ERROR`: Request validation failed
- `DB_ERROR`: Database operation failed
- `AI_RATE_LIMIT`: AI service rate limit exceeded
- `PROCESSING_ERROR`: General processing error
- `RATE_LIMIT_EXCEEDED`: User rate limit exceeded

### 3. Retry Logic
- **429 Responses**: Include `retryAfter` header
- **5xx Errors**: Include `retryAfter` header
- **Client Guidance**: Clear instructions on when to retry

## 📝 API Endpoints

### Health & Status
- `GET /health` - Health check with uptime and environment info
- `GET /status` - API status with configuration details
- `GET /test-gemini` - Test AI service connectivity

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Reflections
- `GET /reflections` - Get user reflections (cached)
- `POST /reflections` - Create new reflection with AI response

### Statistics
- `GET /stats` - Get user statistics (cached)
- `POST /stats/clear-cache` - Clear user's stats cache

## 🚦 Rate Limiting Details

### Global Limits
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Scope**: All endpoints

### AI Endpoint Limits
- **Window**: 15 minutes
- **Limit**: 20 requests per IP
- **Scope**: `/test-gemini` endpoint

### User Limits
- **Window**: 15 minutes
- **Limit**: 100 requests per authenticated user
- **Scope**: All authenticated endpoints

## 📊 Performance Benchmarks

### Expected Improvements
- **Response Time**: 20-40% reduction for cached endpoints
- **Throughput**: 30-50% increase with compression
- **Database Load**: 40-60% reduction with caching
- **Error Rate**: 80% reduction with better validation

### Monitoring Thresholds
- **Fast**: <50ms (potential caching opportunity)
- **Normal**: 50-1000ms (acceptable performance)
- **Slow**: >1000ms (investigation needed)
- **Very Slow**: >5000ms (critical issue)

## 🛠️ Implementation Notes

### 1. Development vs Production
- **Development**: Detailed error messages, debug logging
- **Production**: Sanitized errors, minimal logging, strict security

### 2. Cache Management
- **Memory Usage**: Monitor cache size in production
- **Redis Migration**: Consider Redis for production caching
- **Cache Warming**: Implement cache warming for frequently accessed data

### 3. Monitoring
- **Log Aggregation**: Use tools like ELK stack or similar
- **Metrics Collection**: Consider Prometheus/Grafana for metrics
- **Alerting**: Set up alerts for slow responses and high error rates

## 🔮 Future Optimizations

### 1. Database
- **Connection Pooling**: Implement connection pooling for database
- **Query Optimization**: Add database indexes for frequently queried fields
- **Read Replicas**: Consider read replicas for heavy read workloads

### 2. Caching
- **Redis Integration**: Replace in-memory cache with Redis
- **CDN Integration**: Add CDN for static assets
- **Edge Caching**: Implement edge caching for global users

### 3. Performance
- **GraphQL**: Consider GraphQL for more efficient data fetching
- **WebSockets**: Real-time updates for better user experience
- **Service Workers**: Offline support and caching

## 📚 Best Practices

### 1. Client Implementation
- **Retry Logic**: Implement exponential backoff for failed requests
- **Cache Headers**: Respect cache headers for optimal performance
- **Rate Limiting**: Handle 429 responses gracefully

### 2. Error Handling
- **User Feedback**: Show meaningful error messages to users
- **Retry Strategy**: Implement smart retry logic
- **Fallback Content**: Provide fallback content when services fail

### 3. Performance
- **Lazy Loading**: Load data only when needed
- **Pagination**: Implement pagination for large datasets
- **Optimistic Updates**: Update UI optimistically for better UX
