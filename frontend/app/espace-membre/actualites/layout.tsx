import NewsAmbientMusic from "@/components/NewsAmbientMusic";

export default function ActualitesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NewsAmbientMusic />
      {children}
    </>
  );
}
