FROM node:24-bookworm

# Git・基本ツールをインストール
RUN apt-get update && apt-get install -y \
    git curl ca-certificates sudo \
    && rm -rf /var/lib/apt/lists/*

# node ユーザーにパスワードなし sudo を付与
RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# ~/.claude ボリュームマウント用ディレクトリを事前作成（node 所有）
RUN mkdir -p /home/node/.claude && chown node:node /home/node/.claude

EXPOSE 3000
