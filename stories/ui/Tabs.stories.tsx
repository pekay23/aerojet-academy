import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-100">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-muted-foreground p-4 text-sm">Account settings and preferences.</p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-muted-foreground p-4 text-sm">Change your password here.</p>
      </TabsContent>
    </Tabs>
  ),
}

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-125">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-muted-foreground p-4 text-sm">Dashboard overview with key metrics.</p>
      </TabsContent>
      <TabsContent value="analytics">
        <p className="text-muted-foreground p-4 text-sm">Detailed analytics and charts.</p>
      </TabsContent>
      <TabsContent value="reports">
        <p className="text-muted-foreground p-4 text-sm">Generated reports and exports.</p>
      </TabsContent>
    </Tabs>
  ),
}
