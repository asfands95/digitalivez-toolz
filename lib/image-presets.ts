export type SocialImagePreset = { id: string; platform: string; name: string; width: number; height: number }

export const socialImagePresets: SocialImagePreset[] = [
  { id: 'instagram-square', platform: 'Instagram', name: 'Square post', width: 1080, height: 1080 },
  { id: 'instagram-portrait', platform: 'Instagram', name: 'Portrait post', width: 1080, height: 1350 },
  { id: 'instagram-story', platform: 'Instagram', name: 'Story', width: 1080, height: 1920 },
  { id: 'instagram-reel', platform: 'Instagram', name: 'Reel cover', width: 1080, height: 1920 },
  { id: 'facebook-post', platform: 'Facebook', name: 'Post image', width: 1200, height: 630 },
  { id: 'facebook-cover', platform: 'Facebook', name: 'Cover photo', width: 851, height: 315 },
  { id: 'facebook-story', platform: 'Facebook', name: 'Story', width: 1080, height: 1920 },
  { id: 'pinterest-pin', platform: 'Pinterest', name: 'Pin', width: 1000, height: 1500 },
  { id: 'x-post', platform: 'X', name: 'Post image', width: 1600, height: 900 },
  { id: 'linkedin-post', platform: 'LinkedIn', name: 'Post image', width: 1200, height: 627 },
  { id: 'linkedin-cover', platform: 'LinkedIn', name: 'Cover image', width: 1584, height: 396 },
  { id: 'youtube-thumbnail', platform: 'YouTube', name: 'Thumbnail', width: 1280, height: 720 },
]
