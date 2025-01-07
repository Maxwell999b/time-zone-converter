import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeConverter } from "@/components/time-converter";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Time Zone Converter with Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cet-to-cairo">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cet-to-cairo">CET to Cairo</TabsTrigger>
              <TabsTrigger value="cairo-to-cet">Cairo to CET</TabsTrigger>
            </TabsList>
            <TabsContent value="cet-to-cairo">
              <TimeConverter fromZone="CET" toZone="Cairo" offset={1} />
            </TabsContent>
            <TabsContent value="cairo-to-cet">
              <TimeConverter fromZone="Cairo" toZone="CET" offset={-1} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
