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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { StarRating } from '@/components/reviews/StarRating';

interface ReviewWithUser {
  id: string;
  content: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  merchant: {
    id: string;
    name: string;
  } | null;
  images: string[];
  reportCount: number;
}

interface FilterState {
  status: string;
  sortBy: string;
  sortOrder: string;
  merchantSearch: string;
}

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    merchantSearch: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [auditDialog, setAuditDialog] = useState<{ open: boolean; reviewId?: string }>({ open: false });

  const pageSize = 20;

  // 加载点评列表
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.merchantSearch) {
        params.set('merchant', filters.merchantSearch);
      }

      const response = await fetch(`/api/admin/reviews?${params}`);
      if (!response.ok) throw new Error('加载失败');

      const { data } = await response.json();
      setReviews(data.reviews);
      setTotal(data.total);
    } catch (error) {
      console.error('加载点评列表失败:', error);
      toast.error('加载点评列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // 批量操作
  const handleBulkAction = async (action: 'approve' | 'reject' | 'hide' | 'delete') => {
    if (selectedIds.length === 0) {
      toast.error('请选择要操作的点评');
      return;
    }

    if (!confirm(`确定要${getActionName(action)}选中的 ${selectedIds.length} 条点评吗？`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewIds: selectedIds,
        }),
      });

      if (!response.ok) throw new Error('操作失败');

      toast.success(`批量${getActionName(action)}成功`);
      setSelectedIds([]);
      fetchReviews();
    } catch (error) {
      toast.error(`批量${getActionName(action)}失败`);
    }
  };

  // 全选/取消全选
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(reviews.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 单选
  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">审核列表</h1>
          <p className="text-gray-500 mt-1">管理和审核用户提交的点评</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          ← 返回
        </Button>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">状态</label>
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  setFilters({ ...filters, status: value });
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                  <SelectItem value="hidden">已隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">排序</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">提交时间</SelectItem>
                  <SelectItem value="rating">评分</SelectItem>
                  <SelectItem value="reportCount">举报数</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">顺序</label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => setFilters({ ...filters, sortOrder: value })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">商家搜索</label>
              <Input
                placeholder="搜索商家名称..."
                value={filters.merchantSearch}
                onChange={(e) => {
                  setFilters({ ...filters, merchantSearch: e.target.value });
                  setPage(1);
                }}
                className="w-[200px]"
              />
            </div>

            <Button onClick={() => { setPage(1); fetchReviews(); }}>
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作工具栏 */}
      {selectedIds.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium text-blue-900">
                  已选择 {selectedIds.length} 条点评
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleBulkAction('approve')}
                  >
                    批量通过
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('reject')}
                  >
                    批量拒绝
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleBulkAction('hide')}
                  >
                    批量隐藏
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIds([])}
                  >
                    取消选择
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 点评表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length === reviews.length && reviews.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>用户</TableHead>
              <TableHead>商家</TableHead>
              <TableHead>评分</TableHead>
              <TableHead className="max-w-[300px]">内容摘要</TableHead>
              <TableHead>图片</TableHead>
              <TableHead>举报</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  加载中...
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  暂无点评数据
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(review.id)}
                      onCheckedChange={(checked) => toggleSelect(review.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {review.user.name || review.user.email}
                      </div>
                      <div className="text-xs text-gray-500">{review.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.merchant?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} readOnly size="sm" />
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate text-sm text-gray-600">
                      {review.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    {review.images.length > 0 ? (
                      <Badge variant="secondary">{review.images.length} 张</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {review.reportCount > 0 ? (
                      <Badge variant="destructive">{review.reportCount}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={review.status} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAuditDialog({ open: true, reviewId: review.id })}
                    >
                      审核
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 分页 */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-500">
            显示 {Math.min((page - 1) * pageSize + 1, total)}-{Math.min(page * pageSize, total)} 条，共 {total} 条
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= total}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </Card>

      {/* 审核弹窗 */}
      {auditDialog.open && auditDialog.reviewId && (
        <AuditDialog
          reviewId={auditDialog.reviewId}
          open={auditDialog.open}
          onOpenChange={(open) => setAuditDialog({ open })}
          onAuditComplete={() => {
            setAuditDialog({ open: false });
            fetchReviews();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    hidden: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    hidden: '已隐藏',
  };

  return (
    <Badge variant="outline" className={variants[status as keyof typeof variants]}>
      {labels[status as keyof typeof labels]}
    </Badge>
  );
}

function getActionName(action: string): string {
  const names: Record<string, string> = {
    approve: '通过',
    reject: '拒绝',
    hide: '隐藏',
    delete: '删除',
  };
  return names[action] || action;
}

// 审核弹窗组件
interface AuditDialogProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuditComplete: () => void;
}

function AuditDialog({ reviewId, open, onOpenChange, onAuditComplete }: AuditDialogProps) {
  const [review, setReview] = useState<ReviewWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'approve' | 'reject' | 'hide' | 'delete'>('approve');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`/api/admin/reviews/${reviewId}`);
        if (!response.ok) throw new Error('加载失败');
        const { data } = await response.json();
        setReview(data);
      } catch (error) {
        toast.error('加载点评详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [reviewId]);

  const handleSubmit = async () => {
    if (action === 'reject' && !reason.trim()) {
      toast.error('拒绝点评需要填写理由');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });

      if (!response.ok) throw new Error('审核失败');

      toast.success('审核成功');
      onAuditComplete();
    } catch (error) {
      toast.error('审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>审核点评</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">加载中...</div>
        ) : review ? (
          <div className="space-y-4">
            {/* 点评信息 */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.user.name || review.user.email}</span>
                <Badge variant="secondary">{review.user.email}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>商家：</span>
                <span className="font-medium">{review.merchant?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>评分：</span>
                <StarRating rating={review.rating} readOnly size="sm" />
              </div>
              <div>
                <span>内容：</span>
                <p className="mt-1 text-gray-700">{review.content}</p>
              </div>
              {review.images.length > 0 && (
                <div>
                  <span>图片：</span>
                  <div className="flex gap-2 mt-1">
                    {review.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Review image ${i + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 审核操作 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">审核操作</label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={action === 'approve' ? 'default' : 'outline'}
                  onClick={() => setAction('approve')}
                >
                  通过
                </Button>
                <Button
                  variant={action === 'reject' ? 'destructive' : 'outline'}
                  onClick={() => setAction('reject')}
                >
                  拒绝
                </Button>
                <Button
                  variant={action === 'hide' ? 'secondary' : 'outline'}
                  onClick={() => setAction('hide')}
                >
                  隐藏
                </Button>
                <Button
                  variant={action === 'delete' ? 'outline' : 'outline'}
                  onClick={() => setAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  删除
                </Button>
              </div>
            </div>

            {action === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  拒绝理由 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="请说明拒绝原因..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '提交中...' : '提交审核'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
