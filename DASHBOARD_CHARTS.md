# Dashboard Charts Documentation

The main dashboard now includes several interactive charts to help users visualize their expense data.

## Available Charts

### 1. Expense Trend Chart
- **Type**: Area Chart
- **Data**: Daily spending over the last 7 days
- **Purpose**: Shows spending patterns and trends
- **Location**: Top left of charts section

### 2. Group Spending Chart
- **Type**: Pie Chart
- **Data**: Total spending breakdown by group
- **Purpose**: Visualizes which groups you spend the most in
- **Location**: Top right of charts section

### 3. Monthly Spending Chart
- **Type**: Bar Chart
- **Data**: Monthly spending over the last 6 months
- **Purpose**: Shows long-term spending trends
- **Location**: Full width below other charts

## Chart Features

### Interactive Elements
- **Tooltips**: Hover over chart elements to see detailed information
- **Responsive Design**: Charts adapt to different screen sizes
- **Currency Formatting**: All monetary values display with proper currency symbols

### Data Processing
- **Real-time Data**: Charts update automatically when new expenses are added
- **Smart Grouping**: Data is intelligently grouped by time periods and categories
- **Empty State Handling**: Charts show helpful messages when no data is available

## Chart Components

### ExpenseTrendChart
```typescript
interface ExpenseTrendData {
  date: string;
  amount: number;
  count: number;
}
```

### GroupSpendingChart
```typescript
interface GroupSpendingData {
  name: string;
  value: number;
  color?: string;
}
```

### MonthlySpendingChart
```typescript
interface MonthlySpendingData {
  month: string;
  amount: number;
  count: number;
}
```

## Styling

All charts use the project's design system:
- **Colors**: Use CSS variables from the theme (--chart-1, --chart-2, etc.)
- **Typography**: Consistent with the app's font system
- **Spacing**: Follow the established grid system
- **Cards**: Wrapped in consistent card components

## Conditional Rendering

Charts only appear when there is expense data available. If no expenses exist, users see helpful empty states with calls-to-action to create their first group or add expenses.

## Performance

- **Efficient Data Processing**: Data is processed once and cached
- **Optimized Queries**: Only necessary data is fetched from the database
- **Lazy Loading**: Charts are only rendered when data is available
