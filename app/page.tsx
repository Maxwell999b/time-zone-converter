import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeConverter } from "@/components/time-converter";
import { ThemeToggle } from "@/components/theme-toggle";

const timeZones = {
  UTC: 0,
  PST: -8,
  PDT: -7,
  EST: -5,
  EDT: -4,
  CST: -6,
  CET: 1,
  CEST: 2,
  BST: 1,
  JST: 9,
  KST: 9,
  "CST (China)": 8,
  AEST: 10,
  AEDT: 11,
  IST: 5.5,
  BRT: -3,
  SAST: 2,
  Cairo: 2,
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-2xl card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl md:text-3xl font-bold tracking-tight">
            Time Zone Converter for Gamers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeConverter timeZones={timeZones} />
        </CardContent>
      </Card>
    </main>
  );
}
