interface TeamMemberProps {
  name: string
  role: string
  image: string
  bio: string
}

export function TeamMember({ name, role, image, bio }: TeamMemberProps) {
  return (
    <div className="flex flex-col items-center text-center reactive-card p-6 rounded-lg bg-white shadow-md">
      <img src={image || "/placeholder.svg"} alt={name} className="w-32 h-32 rounded-full object-cover mb-4" />
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="text-primary-600 font-medium mb-3">{role}</p>
      <p className="text-foreground/80">{bio}</p>
    </div>
  )
}
