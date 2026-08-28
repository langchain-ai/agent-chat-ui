# Use node.js 18 as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Configure environment variables
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Set the SHELL environment variable to bash
ENV SHELL=/bin/bash

# Update the package and install the dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl bash && \
    curl -fsSL https://get.pnpm.io/install.sh | sh -s && \
    pnpm install

# Copy the entire project files
COPY . .

# Expose Application Port
EXPOSE 3000

# Run the app
CMD ["pnpm", "dev"]