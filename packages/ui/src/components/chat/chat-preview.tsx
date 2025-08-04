import { authClient } from "@ferix/ui/lib/auth-client";

export function ChatPreview() {
    const {data: session} = authClient.useSession();
    const firstName = session?.user?.name?.split(' ')[0];
    const displayString = `Hey ${firstName ?? 'there'}, what's on your mind?`;

  return <div className="text-center text-2xl">{displayString}</div>;
}