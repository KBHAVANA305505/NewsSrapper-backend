FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install ALL dependencies (including dev dependencies)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Run the build command to compile TypeScript
RUN npm run build


# ---- Production Stage ----
# This is the final, lean image that will run on Render.
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the compiled code from the 'builder' stage
# This assumes your compiled code is in a 'dist' folder. Adjust if it's different.
COPY --from=builder /app/dist ./dist

# Copy the healthcheck script
COPY healthcheck.js ./

# Create logs directory
RUN mkdir -p logs

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3001

# Add the health check from your original file
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# The command to start the application
# Ensure your "start" script in package.json runs the compiled code (e.g., "node dist/index.js")
CMD ["npm", "start"]