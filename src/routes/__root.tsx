import { createRootRouteWithContext, HeadContent, Outlet, Scripts, Link, useRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold brand-text">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">That route doesn't exist.</p>
        <Link to="/" className="inline-block mt-5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">Go to Dashboard</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">Retry</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VoiceBroker AI — Voice-Activated xStock Trading" },
      { name: "description", content: "The world's first fully autonomous voice-activated trading desk for xStocks. Built for AI Agent Olympics 2026." },
      { name: "theme-color", content: "#0f0f1a" },
      { property: "og:title", content: "VoiceBroker AI — Voice-Activated xStock Trading" },
      { property: "og:description", content: "The world's first fully autonomous voice-activated trading desk for xStocks. Built for AI Agent Olympics 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "VoiceBroker AI — Voice-Activated xStock Trading" },
      { name: "twitter:description", content: "The world's first fully autonomous voice-activated trading desk for xStocks. Built for AI Agent Olympics 2026." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/37a219c3-341c-40e2-8589-a9dca1f1f42a" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/37a219c3-341c-40e2-8589-a9dca1f1f42a" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="dark">{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  );
}
