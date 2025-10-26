'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Receipt } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
  created_at: string;
  currency: string;
  memberCount: number;
  expenseCount: number;
  totalSpent: number;
}

interface AnimatedGroupsPageProps {
  groups: Group[];
}

export function AnimatedGroupsPage({ groups }: AnimatedGroupsPageProps) {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div 
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">Manage your expense groups</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary' asChild>
            <Link href="/dashboard/groups/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Groups Grid */}
      {!groups || groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No groups yet</h3>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Create your first group to start tracking shared expenses with friends or family
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary' asChild>
                  <Link href="/dashboard/groups/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Group
                  </Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.4 + (index * 0.1),
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -4,
                transition: { duration: 0.2 }
              }}
            >
              <Link href={`/dashboard/groups/${group.id}`}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{group.name}</CardTitle>
                    <CardDescription>Created {formatDate(group.created_at)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{group.memberCount}</span>
                        <span className="text-muted-foreground">
                          member{group.memberCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{group.expenseCount}</span>
                        <span className="text-muted-foreground">
                          expense{group.expenseCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-xl font-bold">{formatCurrency(group.totalSpent, group.currency)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
