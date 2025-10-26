'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Receipt, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AnimatedStatsCardsProps {
  totalGroups: number;
  totalExpenses: number;
  totalSpent: number;
  currency: string;
}

export function AnimatedStatsCards({ 
  totalGroups, 
  totalExpenses, 
  totalSpent, 
  currency 
}: AnimatedStatsCardsProps) {
  const stats = [
    {
      title: 'Total Groups',
      value: totalGroups,
      icon: Users,
      description: 'Groups you\'re part of'
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: Receipt,
      description: 'All time expenses'
    },
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      description: 'Across all groups'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            whileHover={{ 
              y: -2,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
