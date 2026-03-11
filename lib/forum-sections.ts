export const FORUM_SECTIONS = [
    {
        id: "general",
        name: "综合交流",
        description: "闲聊、求助、站务和不限定具体游戏的讨论",
    },
    {
        id: "osu",
        name: "osu!专区",
        description: "osu!、osu!mania、作图、谱面与玩法讨论",
    },
    {
        id: "maimai",
        name: "maimai专区",
        description: "maimai DX、曲目、段位与街机体验交流",
    },
    {
        id: "pjsk",
        name: "Project Sekai专区",
        description: "世界计划、角色、活动与卡池讨论",
    },
    {
        id: "arcaea",
        name: "Arcaea专区",
        description: "Arcaea 曲包、搭档、定数与收歌交流",
    },
    {
        id: "event",
        name: "赛事活动",
        description: "线下活动、比赛、约玩、展会和社区招募",
    },
] as const;

export type ForumSectionId = (typeof FORUM_SECTIONS)[number]["id"];

export function getForumSectionMeta(sectionId: string) {
    return (
        FORUM_SECTIONS.find((section) => section.id === sectionId) ??
        FORUM_SECTIONS[0]
    );
}
