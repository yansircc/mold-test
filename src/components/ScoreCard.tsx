import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BalanceScore } from "@/types/algorithm/balance/types";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  score: BalanceScore;
  className?: string;
}

/**
 * 展示平衡分析得分的卡片组件
 */
export function ScoreCard({ score, className }: ScoreCardProps) {
  // 根据分数获取颜色
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  // 获取进度条颜色
  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>平衡分析得分</span>
          <span
            className={cn("text-2xl font-bold", getScoreColor(score.total))}
          >
            {Math.round(score.total)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>几何平衡</span>
            <span className={getScoreColor(score.details.geometry.overall)}>
              {Math.round(score.details.geometry.overall)}
            </span>
          </div>
          <Progress
            value={score.details.geometry.overall}
            className={cn("h-2", getProgressColor(score.details.geometry.overall))}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>流动平衡</span>
            <span className={getScoreColor(score.details.flow.overall)}>
              {Math.round(score.details.flow.overall)}
            </span>
          </div>
          <Progress
            value={score.details.flow.overall}
            className={cn("h-2", getProgressColor(score.details.flow.overall))}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>分布平衡</span>
            <span className={getScoreColor(score.details.distribution.overall)}>
              {Math.round(score.details.distribution.overall)}
            </span>
          </div>
          <Progress
            value={score.details.distribution.overall}
            className={cn("h-2", getProgressColor(score.details.distribution.overall))}
          />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          置信度: {Math.round(score.confidence * 100)}%
        </div>
      </CardContent>
    </Card>
  );
}
