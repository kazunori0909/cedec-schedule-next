FROM node:24-bookworm

# Git・基本ツールをインストール
RUN apt-get update && apt-get install -y \
    git curl ca-certificates sudo \
    && rm -rf /var/lib/apt/lists/*

# node ユーザーにパスワードなし sudo を付与
RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# ~/.claude・~/.config/gh ボリュームマウント用ディレクトリを事前作成（node 所有）
# 事前作成しないとボリュームが root 所有でマウントされ、gh auth login の認証情報を保存できない
RUN mkdir -p /home/node/.claude /home/node/.config/gh \
    && chown -R node:node /home/node/.claude /home/node/.config

EXPOSE 3000
