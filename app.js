require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

let cursor;
async function findConversation() {
  try {
    const channelList = await app.client.conversations.list({
      token: process.env.SLACK_USER_TOKEN,
      exclude_archived: true,
      limit: 1000,
      cursor,
    });
    if (channelList.response_metadata.next_cursor) {
      cursor = channelList.response_metadata.next_cursor;
      findConversation();
    }

    channelList.channels.forEach(async (channel) => {
      if (channel.name === "slack_api_test") {
        const conversation = await app.client.conversations.history({
          token: process.env.SLACK_USER_TOKEN,
          channel: channel.id,
          limit: 1000,
        });
        // リアクションがついているメッセージを抽出
        const reactions = conversation.messages.filter((message) => {
          return message.reactions;
        });

        // パーマリンクを取得
        reactions.forEach(async (reaction) => {
          const permalink = await app.client.chat.getPermalink({
            token: process.env.SLACK_USER_TOKEN,
            channel: channel.id,
            message_ts: reaction.ts,
          });
          console.log("permalink:", permalink);
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
}

findConversation();

(async () => {
  // アプリを起動します
  await app.start();

  console.log("⚡️ Bolt app is running!");
})();
