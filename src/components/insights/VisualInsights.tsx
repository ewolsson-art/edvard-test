 import { useState } from 'react';
 import { Sparkles, RefreshCw, Loader2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { InsightsSummaryCard } from './InsightsSummaryCard';
 import { RiskIndicator } from './RiskIndicator';
 import { RecommendationCard } from './RecommendationCard';
 import { WeeklyComparisonChart } from './WeeklyComparisonChart';
 import ReactMarkdown from 'react-markdown';
 
 interface StructuredInsight {
   summary: {
     status: 'good' | 'warning' | 'alert';
     title: string;
     description: string;
   };
   moodTrend: {
     direction: 'up' | 'down' | 'stable';
     percentage: number;
     dominantMood: 'elevated' | 'stable' | 'depressed';
   };
   riskIndicators: {
     type: 'sleep' | 'exercise' | 'eating' | 'mood';
     label: string;
     currentStreak: number;
     riskLevel: number;
     historicalImpact: string | null;
   }[];
   recommendations: {
     priority: 'high' | 'medium' | 'low';
     icon: 'sleep' | 'exercise' | 'food' | 'warning' | 'calendar' | 'heart';
     title: string;
     description: string;
   }[];
   weeklyComparison: {
     metric: string;
     current: number;
     previous: number;
     change: number;
   }[];
 }
 
 interface VisualInsightsProps {
   structured: StructuredInsight | null;
   textInsights: string | null;
   isLoading: boolean;
   onGenerate: () => void;
   patternsDetected: number;
 }
 
 export function VisualInsights({ 
   structured, 
   textInsights, 
   isLoading, 
   onGenerate,
   patternsDetected 
 }: VisualInsightsProps) {
   const [showFullText, setShowFullText] = useState(false);
 
   if (isLoading) {
     return (
       <div className="flex flex-col items-center justify-center py-12 gap-4">
         <div className="relative">
           <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
           <div className="relative bg-primary/10 p-6 rounded-full">
             <Loader2 className="w-10 h-10 animate-spin text-primary" />
           </div>
         </div>
         <div className="text-center">
           <p className="font-medium">Analyserar dina mönster...</p>
           <p className="text-sm text-muted-foreground">Jämför med historisk data</p>
         </div>
       </div>
     );
   }
 
   if (!structured) {
     return (
       <div className="text-center py-8">
         <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto mb-4">
           <Sparkles className="w-10 h-10 text-primary" />
         </div>
         <h3 className="text-lg font-semibold mb-2">Prediktiv analys</h3>
         <p className="text-muted-foreground mb-6 max-w-md mx-auto">
           Få AI-drivna insikter baserade på dina historiska mönster. Identifiera varningssignaler och förutse humörsvängningar.
         </p>
         <Button onClick={onGenerate} size="lg" className="gap-2">
           <Sparkles className="w-5 h-5" />
           Starta analys
         </Button>
       </div>
     );
   }
 
   // Sort recommendations by priority
   const sortedRecommendations = [...structured.recommendations].sort((a, b) => {
     const order = { high: 0, medium: 1, low: 2 };
     return order[a.priority] - order[b.priority];
   });
 
   // Sort risk indicators by risk level
   const sortedRisks = [...structured.riskIndicators].sort((a, b) => b.riskLevel - a.riskLevel);
 
   return (
     <div className="space-y-6">
       {/* Summary Card */}
       <InsightsSummaryCard
         status={structured.summary.status}
         title={structured.summary.title}
         description={structured.summary.description}
         moodTrend={structured.moodTrend}
       />
 
       {/* Main Grid */}
       <div className="grid md:grid-cols-2 gap-6">
         {/* Risk Indicators */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
               <span className="bg-primary/10 p-1.5 rounded-lg">
                 <Sparkles className="w-4 h-4 text-primary" />
               </span>
               Riskindikatorer
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {sortedRisks.map((risk, i) => (
               <RiskIndicator key={i} {...risk} />
             ))}
           </CardContent>
         </Card>
 
         {/* Weekly Comparison */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
               <span className="bg-primary/10 p-1.5 rounded-lg">
                 <RefreshCw className="w-4 h-4 text-primary" />
               </span>
               Veckotrend
             </CardTitle>
           </CardHeader>
           <CardContent>
             <WeeklyComparisonChart data={structured.weeklyComparison} />
           </CardContent>
         </Card>
       </div>
 
       {/* Recommendations */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base">Rekommendationer</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           {sortedRecommendations.map((rec, i) => (
             <RecommendationCard key={i} {...rec} />
           ))}
         </CardContent>
       </Card>
 
       {/* Collapsible Full Text Analysis */}
       {textInsights && (
         <Collapsible open={showFullText} onOpenChange={setShowFullText}>
           <Card>
             <CollapsibleTrigger asChild>
               <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                 <CardTitle className="text-base flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="bg-primary/10 p-1.5 rounded-lg">
                       <FileText className="w-4 h-4 text-primary" />
                     </span>
                     Fullständig AI-analys
                   </div>
                   {showFullText ? (
                     <ChevronUp className="w-5 h-5 text-muted-foreground" />
                   ) : (
                     <ChevronDown className="w-5 h-5 text-muted-foreground" />
                   )}
                 </CardTitle>
               </CardHeader>
             </CollapsibleTrigger>
             <CollapsibleContent>
               <CardContent className="pt-0">
                 <div className="prose prose-sm dark:prose-invert max-w-none">
                   <ReactMarkdown>{textInsights}</ReactMarkdown>
                 </div>
               </CardContent>
             </CollapsibleContent>
           </Card>
         </Collapsible>
       )}
 
       {/* Refresh Button */}
       <div className="flex items-center justify-between pt-2">
         <p className="text-xs text-muted-foreground">
           {patternsDetected > 0 && `${patternsDetected} historiska mönster analyserade`}
         </p>
         <Button variant="outline" size="sm" onClick={onGenerate} className="gap-2">
           <RefreshCw className="w-4 h-4" />
           Uppdatera analys
         </Button>
       </div>
     </div>
   );
 }