'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Report {
  id: string;
  reviewId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'ignored';
  createdAt: string;
  review: {
    id: string;
    content: string;
    rating: number;
    status: string;
    user: {
      name: string | null;
      email: string;
    };
    merchant: {
      name: string;
    } | null;
  } | null;
  reporter: {
    name: string | null;
    email: string;
  } | null;
}

interface FilterState {
  status: string;
  reason: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    status: 'pending',
    reason: 'all',
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  // 加载举报列表
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filters.status,
      });

      if (filters.reason !== 'all') {
        params.set('reason', filters.reason);
      }

      const response = await fetch(`/api/admin/reports?${params}`);
      if (!response.ok) throw new Error('加载失败');

      const { data } = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error('加载举报列表失败:', error);
      toast.error('加载举报列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewDetail = (report: Report) => {
    setSelectedReport(report);
    setDetailDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">举报处理</h1>
          <p className="text-gray-500 mt-1">处理用户举报的违规点评</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          ← 返回
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="待处理"
          value={reports.filter((r) => r.status === 'pending').length}
          icon="⏳"
          color="bg-amber-500"
        />
        <StatCard
          title="已解决"
          value={reports.filter((r) => r.status === 'resolved').length}
          icon="✅"
          color="bg-green-500"
        />
        <StatCard
          title="已忽略"
          value={reports.filter((r) => r.status === 'ignored').length}
          icon="❌"
          color="bg-gray-500"
        />
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">状态</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                  <SelectItem value="ignored">已忽略</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchReports}>刷新</Button>
          </div>
        </CardContent>
      </Card>

      {/* 举报表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>举报 ID</TableHead>
              <TableHead>被举报点评</TableHead>
              <TableHead>商家</TableHead>
              <TableHead>举报原因</TableHead>
              <TableHead>举报人</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>举报时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  加载中...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  暂无举报数据
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-sm">
                    #{report.id.slice(-6)}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm text-gray-600">
                      {report.review?.content || '点评已删除'}
                    </p>
                  </TableCell>
                  <TableCell>
                    {report.review?.merchant?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{report.reason}</Badge>
                  </TableCell>
                  <TableCell>
                    {report.reporter?.name || report.reporter?.email || '匿名'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetail(report)}
                    >
                      {report.status === 'pending' ? '处理' : '查看'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 详情对话框 */}
      {selectedReport && (
        <ReportDetailDialog
          report={selectedReport}
          open={detailDialog}
          onOpenChange={setDetailDialog}
          onProcessed={() => {
            setDetailDialog(false);
            fetchReports();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-10 rounded-bl-full`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <span className="text-2xl">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    ignored: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const labels = {
    pending: '待处理',
    resolved: '已解决',
    ignored: '已忽略',
  };

  return (
    <Badge variant="outline" className={variants[status as keyof typeof variants]}>
      {labels[status as keyof typeof labels]}
    </Badge>
  );
}

// 举报详情对话框
interface ReportDetailDialogProps {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessed: () => void;
}

function ReportDetailDialog({
  report,
  open,
  onOpenChange,
  onProcessed,
}: ReportDetailDialogProps) {
  const [action, setAction] = useState<'ignore' | 'hide_review' | 'delete_review' | 'ban_user'>(
    'ignore'
  );
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/reports/${report.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });

      if (!response.ok) throw new Error('处理失败');

      toast.success('举报处理成功');
      onProcessed();
    } catch (error) {
      toast.error('举报处理失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>举报详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 举报信息 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">举报 ID:</span>
              <span className="font-mono">#{report.id.slice(-6)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">举报原因:</span>
              <Badge variant="destructive">{report.reason}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">举报时间:</span>
              <span>{new Date(report.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">举报人:</span>
              <span>{report.reporter?.name || report.reporter?.email || '匿名'}</span>
            </div>
          </div>

          {/* 被举报点评信息 */}
          {report.review && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900">被举报点评</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">用户:</span>
                <span>{report.review.user.name || report.review.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">商家:</span>
                <span>{report.review.merchant?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">评分:</span>
                <span>{'⭐'.repeat(report.review.rating)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">内容:</span>
                <p className="mt-1 text-gray-700">{report.review.content}</p>
              </div>
            </div>
          )}

          {/* 处理操作 */}
          {report.status === 'pending' && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">处理操作</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={action === 'ignore' ? 'default' : 'outline'}
                    onClick={() => setAction('ignore')}
                  >
                    忽略
                  </Button>
                  <Button
                    variant={action === 'hide_review' ? 'secondary' : 'outline'}
                    onClick={() => setAction('hide_review')}
                  >
                    隐藏点评
                  </Button>
                  <Button
                    variant={action === 'delete_review' ? 'destructive' : 'outline'}
                    onClick={() => setAction('delete_review')}
                  >
                    删除点评
                  </Button>
                  <Button
                    variant={action === 'ban_user' ? 'destructive' : 'outline'}
                    onClick={() => setAction('ban_user')}
                  >
                    封禁用户
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">处理说明</label>
                <Input
                  placeholder="填写处理说明（可选）..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '处理中...' : '提交处理'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
