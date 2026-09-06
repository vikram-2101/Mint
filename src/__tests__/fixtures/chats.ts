// Android 24-hour format with multiline text, system events, and media omission
export const ANDROID_24H_CHAT = `15/08/2026, 10:00 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.
15/08/2026, 10:01 - Alice created group "Palm Grove Residents"
15/08/2026, 10:05 - Alice: Welcome everyone to the group!
Please check the building guidelines below:
1. Keep noise down after 10 PM.
2. Park only in designated slots.
15/08/2026, 10:15 - Bob: Thanks Alice!
Quick question: who is handling the visitor parking permits?
15/08/2026, 10:20 - Charlie: <Media omitted>
15/08/2026, 10:22 - Charlie: Here is the photo of the new parking sign.
15/08/2026, 10:30 - Alice: We have decided that visitor permits will start from September 1st.
Please register at the security desk before Friday.
16/08/2026, 09:00 - David joined using this group's invite link
16/08/2026, 09:15 - David: Hi all, is the gym open today?
16/08/2026, 09:20 - Bob: Yes, 6 AM to 10 PM daily.`;

// Android 12-hour format with AM/PM (including unicode spaces)
export const ANDROID_12H_CHAT = `8/15/26, 10:00 AM - Messages and calls are end-to-end encrypted.
8/15/26, 10:05 AM - Sarah Connor: Good morning team.
Meeting scheduled for tomorrow at 2 PM.
Agenda:
- Budget review
- Project timeline
8/15/26, 10:30 AM - John Doe: Noted Sarah.
Will prepare the financial slides.
8/15/26, 2:45 PM - Sarah Connor: Thanks John.
8/16/26, 11:15 AM - Emily: Are we doing this in Room 302?
8/16/26, 11:20 AM - Sarah Connor: Yes, Room 302 or via Zoom link.`;

// iOS bracketed format with seconds and 24h
export const IOS_24H_CHAT = `[15/08/2026, 14:30:10] Messages and calls are end-to-end encrypted.
[15/08/2026, 14:31:00] Dr. Evelyn: Team, the annual symposium will be held on Oct 15.
Abstract submission deadline is Sep 20.
[15/08/2026, 14:35:22] Dr. Evelyn: <attached: 00000001-PHOTO-2026-08-15-14-35-22.jpg>
[15/08/2026, 14:40:05] Marcus: Thanks Dr. Evelyn.
I will submit our paper on neural networks by next Tuesday.
[15/08/2026, 15:10:00] Marcus: Did anyone receive the reviewer comments yet?
[15/08/2026, 15:15:30] Dr. Evelyn: Not yet, expected by Friday.`;

// iOS bracketed format with AM/PM
export const IOS_12H_CHAT = `[8/15/26, 2:30:15 PM] Alex: Hey guys, soccer match at 5 PM today?
[8/15/26, 2:32:00 PM] Jordan: I'm in! Bringing the ball.
[8/15/26, 2:35:40 PM] Sam: Can't make it today, working late.
[8/15/26, 2:40:00 PM] Jordan: image omitted
[8/15/26, 2:41:00 PM] Jordan: New jerseys just arrived!`;

// Edge cases chat (blank lines, colons in text, special symbols, etc.)
export const EDGE_CASES_CHAT = `
15.08.2026, 12:00 - Alice: Note: The URL is https://example.com:8080/path?id=1:2:3

15.08.2026, 12:05 - Bob: Multi:
Line:
With:
Colons: everywhere!
15.08.2026, 12:10 - Alice changed the subject to "Emergency Ops 2026"
15.08.2026, 12:15 - Bob: ‎<attached: audio.opus>
`;
