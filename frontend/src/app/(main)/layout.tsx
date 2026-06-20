import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-grow pt-16 min-h-screen flex flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
