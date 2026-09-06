import NewsAmbientMusic from "@/components/NewsAmbientMusic";

export default function NewsLayout({
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
