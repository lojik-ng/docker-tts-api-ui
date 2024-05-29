FROM ghcr.io/coqui-ai/tts

RUN apt-get update \
    && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /shared

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/

# Make entrypoint script executable
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the default command to run the entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]


