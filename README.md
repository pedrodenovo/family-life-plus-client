# Family Life+ Client

[![](https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3/assets/cozy/social/discord-plural_vector.svg)](https://discord.com/invite/HAS99pEwJ4)[![](https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3.2.0/assets/cozy/social/youtube-singular_vector.svg)](https://m.youtube.com/channel/UCrq1E1rJEaYDXeU1qXk9OaQ)[![](https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3.2.0/assets/cozy/social/twitter-singular_vector.svg)](https://x.com/sunrise_studioo)

# Sobre o projeto:
Isso é um WebSocket client para o addon **Family Life+** para Minecraft Bedrock. Esse WebSocket conecta o Minecraft com uma IA que gera resposta de diálogo e outras funções para os NPCS do Family Life.

# Como instalar 
- [Android](#android) 
- [Windows](#Windows)

## Android:
- Baixe e instale o Termux: Link de download oficial
- Copie e cole essa linha de comando no Termux
```
  pkg upgrade && pkg install nodejs && pkg install git && pkg install unzip && git clone https://github.com/pedrodenovo/family-life-plus-client.git && cd family-life-plus-client && unzip family-life-client.zip -d ../ && cd .. && rm -rf family-life-plus-client && cd family-life-client && node client.js
```
- Em um mundo de Minecraft com cheats ativados use o comando /connect localhost:3000

