export const canManageScore = (score, profile) =>
  profile?.role === 'admin' || Boolean(profile?.id && score?.uploader_id === profile.id)

export const canUpload = (profile) => Boolean(profile?.id)
