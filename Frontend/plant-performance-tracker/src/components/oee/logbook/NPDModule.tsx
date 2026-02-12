import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NPDModule = () => {
  return (
    <Card className="bg-card shadow-sm">
      <CardHeader>
        <CardTitle>NPD (New Product Development)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">NPD module functionality will be implemented in the next iteration.</p>
      </CardContent>
    </Card>
  );
};

export default NPDModule;
