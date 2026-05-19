'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ThemeDemoPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dark Mode Theme Demo</h1>
          <p className="text-muted-foreground">
            All colors are WCAG AA compliant with proper contrast ratios
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Base Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Base Colors</CardTitle>
          <CardDescription>Background and foreground colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background border rounded-lg">
              <p className="text-foreground font-medium">Background + Foreground</p>
              <p className="text-muted-foreground text-sm">Default text color</p>
            </div>
            <div className="p-4 bg-card border rounded-lg">
              <p className="text-card-foreground font-medium">Card + Card Foreground</p>
              <p className="text-muted-foreground text-sm">Card background</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Colors</CardTitle>
          <CardDescription>Interactive and status colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="w-full">Primary Button</Button>
            <Button variant="secondary" className="w-full">
              Secondary
            </Button>
            <Button variant="destructive" className="w-full">
              Destructive
            </Button>
            <Button variant="outline" className="w-full">
              Outline
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-success text-success-foreground rounded-lg text-center">
              <p className="font-medium">Success</p>
              <p className="text-sm opacity-90">Approvals</p>
            </div>
            <div className="p-4 bg-warning text-warning-foreground rounded-lg text-center">
              <p className="font-medium">Warning</p>
              <p className="text-sm opacity-90">Pending</p>
            </div>
            <div className="p-4 bg-destructive text-destructive-foreground rounded-lg text-center">
              <p className="font-medium">Destructive</p>
              <p className="text-sm opacity-90">Errors</p>
            </div>
            <div className="p-4 bg-info text-info-foreground rounded-lg text-center">
              <p className="font-medium">Info</p>
              <p className="text-sm opacity-90">Information</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Colors</CardTitle>
          <CardDescription>Colors for different claims processing platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-[hsl(var(--platform-facet))] text-white rounded-lg text-center">
              <p className="text-2xl font-bold">Facet</p>
              <p className="text-sm opacity-90">Purple Platform</p>
            </div>
            <div className="p-6 bg-[hsl(var(--platform-amisys))] text-white rounded-lg text-center">
              <p className="text-2xl font-bold">Amisys</p>
              <p className="text-sm opacity-90">Teal Platform</p>
            </div>
            <div className="p-6 bg-[hsl(var(--platform-xcelys))] text-white rounded-lg text-center">
              <p className="text-2xl font-bold">Xcelys</p>
              <p className="text-sm opacity-90">Orange Platform</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Status Colors</CardTitle>
          <CardDescription>Colors for claim status indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[hsl(var(--status-pending))] text-white rounded-lg text-center">
              <p className="font-medium">Pending</p>
              <p className="text-sm opacity-90">Awaiting review</p>
            </div>
            <div className="p-4 bg-[hsl(var(--status-approved))] text-white rounded-lg text-center">
              <p className="font-medium">Approved</p>
              <p className="text-sm opacity-90">Claim approved</p>
            </div>
            <div className="p-4 bg-[hsl(var(--status-denied))] text-white rounded-lg text-center">
              <p className="font-medium">Denied</p>
              <p className="text-sm opacity-90">Claim denied</p>
            </div>
            <div className="p-4 bg-[hsl(var(--status-review))] text-white rounded-lg text-center">
              <p className="font-medium">In Review</p>
              <p className="text-sm opacity-90">Under review</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Elements</CardTitle>
          <CardDescription>Focus states and hover effects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Try tabbing through these buttons to see focus indicators:
            </p>
            <div className="flex gap-2">
              <Button>Button 1</Button>
              <Button variant="outline">Button 2</Button>
              <Button variant="secondary">Button 3</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Hover over these cards:</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg interactive-element cursor-pointer">
                <p className="font-medium">Card 1</p>
              </div>
              <div className="p-4 border rounded-lg interactive-element cursor-pointer">
                <p className="font-medium">Card 2</p>
              </div>
              <div className="p-4 border rounded-lg interactive-element cursor-pointer">
                <p className="font-medium">Card 3</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Info */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Compliance</CardTitle>
          <CardDescription>WCAG AA Standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Normal Text</h3>
                <p className="text-sm text-muted-foreground">
                  Minimum contrast ratio: <strong>4.5:1</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  All text colors meet this standard ✓
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Large Text</h3>
                <p className="text-sm text-muted-foreground">
                  Minimum contrast ratio: <strong>3:1</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  All large text colors meet this standard ✓
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Testing</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Run the test suite to verify compliance:
              </p>
              <code className="text-xs bg-background px-2 py-1 rounded">
                npm test -- tailwind.config.test.ts
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
