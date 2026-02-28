'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronRight,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Eye,
  Globe,
  ChevronsDown,
  ChevronsUp,
  Sun,
  Moon,
  X,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  Code2,
  Bell,
  BellOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReviewSessions, submitFeedback, ReviewSession } from '@/hooks/use-review-sessions'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

// 类型定义
type ReviewStatus = 'changes_requested' | 'approved' | 'pending'
type Language = 'zh' | 'en'
type Theme = 'dark' | 'light'

interface ReviewItemDetail {
  id: string
  title: string
  status: ReviewStatus
  time: string
  summary: string
  description: string
  reviewComment?: string
  rawSession?: ReviewSession
}

interface ReviewTask {
  id: string
  title: string
  lastActiveTime: string
  items: ReviewItemDetail[]
  isExpanded?: boolean
  lastTimestamp: number
}

// 国际化文案
const i18n = {
  zh: {
    explorer: '审查列表',
    changesRequested: '打回修改',
    approved: '审核通过',
    pending: '待审阅',
    switchLang: 'EN',
    items: '项',
    expandAll: '展开全部',
    collapseAll: '收起全部',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    // 详情面板
    detailTitle: '审查详情',
    lastActive: '最后活跃',
    reviewCount: '审查项',
    summary: '简要总结',
    description: '详细描述',
    expandDesc: '展开详情',
    collapseDesc: '收起详情',
    reviewComment: '审核意见',
    inputPlaceholder: '请输入审核意见...',
    approveBtn: '通过审核',
    rejectBtn: '打回修改',
    submitSuccess: '提交成功',
    submitError: '提交失败',
    noSelection: '请选择一个审查任务查看详情',
    rejectRequireComment: '请输入审核意见后再打回修改',
    markdownHint: '支持 Markdown 格式',
    // Header
    headerTitle: 'Review Center',
    notificationOn: '通知已开启',
    notificationOff: '通知已关闭',
    // Stats labels
    pendingLabel: '待审阅',
    approvedLabel: '已通过',
    changesRequestedLabel: '已打回',
    loading: '加载中...',
    noTasks: '暂无审查任务',
  },
  en: {
    explorer: 'Review List',
    changesRequested: 'Changes Requested',
    approved: 'Approved',
    pending: 'Pending Review',
    switchLang: '中文',
    items: 'items',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    // Detail panel
    detailTitle: 'Review Details',
    lastActive: 'Last Active',
    reviewCount: 'Review Items',
    summary: 'Summary',
    description: 'Description',
    expandDesc: 'Show Details',
    collapseDesc: 'Hide Details',
    reviewComment: 'Review Comment',
    inputPlaceholder: 'Enter your review comment...',
    approveBtn: 'Approve',
    rejectBtn: 'Request Changes',
    submitSuccess: 'Submitted Successfully',
    submitError: 'Submission Failed',
    noSelection: 'Select a review task to view details',
    rejectRequireComment: 'Please enter a comment before requesting changes',
    markdownHint: 'Markdown supported',
    // Header
    headerTitle: 'Review Center',
    notificationOn: 'Notifications On',
    notificationOff: 'Notifications Off',
    // Stats labels
    pendingLabel: 'Pending',
    approvedLabel: 'Approved',
    changesRequestedLabel: 'Changes',
    loading: 'Loading...',
    noTasks: 'No review tasks',
  },
}

// 主题配置
const themeConfig = {
  dark: {
    container: 'bg-gray-900 border-gray-800/60',
    header: 'bg-gray-800/40 border-gray-700/30',
    headerBg: 'bg-gray-900/95 border-gray-800/50 backdrop-blur-sm',
    toolbar: 'border-gray-800/50',
    toolbarBtn: 'bg-gray-800/40 hover:bg-gray-700/50',
    iconHover: 'group-hover:text-cyan-400',
    themeIconHover: 'group-hover:text-amber-400',
    scrollbarThumb: 'rgba(100, 116, 139, 0.3)',
    scrollbarThumbHover: 'rgba(100, 116, 139, 0.5)',
    taskHover: 'bg-white/5',
    itemHover: 'bg-white/5',
    selectedItem: 'ring-2 ring-cyan-500/50 bg-cyan-500/10',
    text: {
      primary: 'text-gray-200',
      secondary: 'text-gray-300',
      muted: 'text-gray-400',
      time: 'text-gray-500',
    },
    legend: 'border-gray-800/50',
    stats: 'border-gray-800/50 bg-gray-900/30',
    pageBg: 'bg-gray-950',
    decoration: ['bg-cyan-500/5', 'bg-purple-500/5'],
    input: 'bg-gray-800/50 border-gray-700 focus:border-cyan-500',
    card: 'bg-gray-800/30 border-gray-700/50',
    sidebar: 'bg-gray-900/50 border-gray-800/60',
  },
  light: {
    container: 'bg-white border-gray-200',
    header: 'bg-gray-50 border-gray-200',
    headerBg: 'bg-white/95 border-gray-200 backdrop-blur-sm',
    toolbar: 'border-gray-200',
    toolbarBtn: 'bg-gray-100 hover:bg-gray-200',
    iconHover: 'group-hover:text-cyan-500',
    themeIconHover: 'group-hover:text-indigo-500',
    scrollbarThumb: 'rgba(100, 116, 139, 0.2)',
    scrollbarThumbHover: 'rgba(100, 116, 139, 0.4)',
    taskHover: 'bg-gray-100',
    itemHover: 'bg-gray-50',
    selectedItem: 'ring-2 ring-cyan-500/50 bg-cyan-50',
    text: {
      primary: 'text-gray-800',
      secondary: 'text-gray-700',
      muted: 'text-gray-500',
      time: 'text-gray-400',
    },
    legend: 'border-gray-200',
    stats: 'border-gray-200 bg-gray-50',
    pageBg: 'bg-gray-100',
    decoration: ['bg-cyan-500/10', 'bg-purple-500/10'],
    input: 'bg-gray-50 border-gray-300 focus:border-cyan-500',
    card: 'bg-gray-50 border-gray-200',
    sidebar: 'bg-white border-gray-200',
  },
}

// 状态配置
const statusConfig: Record<ReviewStatus, {
  bg: Record<Theme, string>
  icon: Record<Theme, React.ReactNode>
  dotColor: Record<Theme, string>
  borderColor: Record<Theme, string>
  label: Record<Language, string>
}> = {
  changes_requested: {
    bg: { dark: 'bg-rose-500/10', light: 'bg-rose-50' },
    icon: { 
      dark: <RotateCcw className="w-3.5 h-3.5 text-rose-400" />, 
      light: <RotateCcw className="w-3.5 h-3.5 text-rose-500" /> 
    },
    dotColor: { dark: 'bg-rose-400', light: 'bg-rose-500' },
    borderColor: { dark: 'border-rose-500/20', light: 'border-rose-200' },
    label: { zh: '打回修改', en: 'Changes Requested' },
  },
  approved: {
    bg: { dark: 'bg-emerald-500/10', light: 'bg-emerald-50' },
    icon: { 
      dark: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, 
      light: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 
    },
    dotColor: { dark: 'bg-emerald-400', light: 'bg-emerald-500' },
    borderColor: { dark: 'border-emerald-500/20', light: 'border-emerald-200' },
    label: { zh: '审核通过', en: 'Approved' },
  },
  pending: {
    bg: { dark: 'bg-violet-500/10', light: 'bg-violet-50' },
    icon: { 
      dark: <Eye className="w-3.5 h-3.5 text-violet-400" />, 
      light: <Eye className="w-3.5 h-3.5 text-violet-500" /> 
    },
    dotColor: { dark: 'bg-violet-400', light: 'bg-violet-500' },
    borderColor: { dark: 'border-violet-500/20', light: 'border-violet-200' },
    label: { zh: '待审阅', en: 'Pending Review' },
  },
}

// 待审阅通知角标
const PendingBadge: React.FC<{
  count: number
  theme: Theme
  onClick: (e: React.MouseEvent) => void
}> = ({ count, theme, onClick }) => {
  const isDark = theme === 'dark'
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors flex-shrink-0',
        isDark 
          ? 'bg-violet-500/20 border-violet-400/30 hover:bg-violet-500/30' 
          : 'bg-violet-100 border-violet-200 hover:bg-violet-200'
      )}
    >
      <Eye className={cn('w-3 h-3', isDark ? 'text-violet-400' : 'text-violet-500')} />
      <span className={cn('text-[10px] font-medium', isDark ? 'text-violet-300' : 'text-violet-600')}>{count}</span>
    </button>
  )
}

// 状态标签
const StatusTag: React.FC<{
  status: ReviewStatus
  theme: Theme
  lang: Language
}> = ({ status, theme, lang }) => {
  const config = statusConfig[status]
  const isDark = theme === 'dark'
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.bg[theme],
      isDark ? 'border border-white/5 text-gray-200' : 'border text-gray-900'
    )}>
      {config.icon[theme]}
      <span>{config.label[lang]}</span>
    </div>
  )
}

// 简单的Markdown渲染
const MarkdownRenderer: React.FC<{
  content: string
  theme: Theme
}> = ({ content, theme }) => {
  const isDark = theme === 'dark'
  
  // 简单的markdown解析
  const parseMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // 标题
      if (line.startsWith('### ')) {
        return <h4 key={index} className="text-sm font-semibold mt-3 mb-1">{line.slice(4)}</h4>
      }
      if (line.startsWith('## ')) {
        return <h3 key={index} className="text-base font-semibold mt-4 mb-2">{line.slice(3)}</h3>
      }
      if (line.startsWith('# ')) {
        return <h2 key={index} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h2>
      }
      // 列表
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={index} className="ml-4 text-sm leading-relaxed list-disc">
            {renderInline(line.slice(2))}
          </li>
        )
      }
      // 代码块
      if (line.startsWith('`') && line.endsWith('`')) {
        return (
          <code key={index} className={cn(
            'px-1.5 py-0.5 rounded text-xs font-mono break-all whitespace-pre-wrap',
            isDark ? 'bg-gray-800 text-cyan-400' : 'bg-gray-200 text-cyan-600'
          )}>
            {line.slice(1, -1)}
          </code>
        )
      }
      // 空行
      if (line.trim() === '') {
        return <div key={index} className="h-2" />
      }
      // 普通文本
      return <p key={index} className="text-sm leading-relaxed">{renderInline(line)}</p>
    })
  }
  
  // 行内样式
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className={cn(
            'px-1 py-0.5 rounded text-xs font-mono break-all whitespace-pre-wrap',
            isDark ? 'bg-gray-800 text-cyan-400' : 'bg-gray-200 text-cyan-600'
          )}>
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }
  
  return <div className={cn('prose-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>{parseMarkdown(content)}</div>
}

// Review项组件（左侧列表）
const ReviewItemBubble: React.FC<{
  item: ReviewItemDetail
  theme: Theme
  isSelected: boolean
  onClick: () => void
}> = ({ item, theme, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  const config = statusConfig[item.status]
  const tConfig = themeConfig[theme]
  const isDark = theme === 'dark'

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer',
        'border',
        config.borderColor[theme],
        config.bg[theme],
        isHovered && !isSelected && 'scale-[1.01]',
        isHovered && !isSelected && tConfig.itemHover,
        isSelected && tConfig.selectedItem
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dotColor[theme])} />
      <span className={cn(
        'flex-1 text-[13px] truncate transition-colors duration-200',
        isHovered || isSelected ? (isDark ? 'text-white' : 'text-gray-900') : tConfig.text.secondary
      )}>
        {item.title}
      </span>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={cn('text-[11px]', tConfig.text.time)}>{item.time}</span>
        {config.icon[theme]}
      </div>
    </div>
  )
}

// Review任务组件
const ReviewTaskComponent: React.FC<{
  task: ReviewTask
  theme: Theme
  selectedTaskId: string | null
  selectedItemId: string | null
  onToggle: (id: string) => void
  onSelectTask: (taskId: string) => void
  onSelectItem: (taskId: string, itemId: string) => void
  onSelectPending: (taskId: string, itemId: string) => void
}> = ({ task, theme, selectedTaskId, selectedItemId, onToggle, onSelectTask, onSelectItem, onSelectPending }) => {
  const [isHovered, setIsHovered] = useState(false)
  const tConfig = themeConfig[theme]
  const isDark = theme === 'dark'
  const pendingItems = task.items.filter(item => item.status === 'pending')
  const pendingCount = pendingItems.length
  const isTaskSelected = selectedTaskId === task.id

  const handleTaskClick = () => {
    onToggle(task.id)
    onSelectTask(task.id)
  }

  const handlePendingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 展开树
    if (!task.isExpanded) {
      onToggle(task.id)
    }
    // 定位到第一个待审阅项
    if (pendingItems.length > 0) {
      onSelectPending(task.id, pendingItems[0].id)
    }
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200',
          isHovered && tConfig.taskHover,
          isTaskSelected && !selectedItemId && tConfig.selectedItem
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleTaskClick}
      >
        <div className={cn(
          'transition-transform duration-200',
          task.isExpanded ? 'rotate-90' : 'rotate-0'
        )}>
          <ChevronRight className={cn(
            'w-4 h-4 transition-colors',
            isHovered ? 'text-cyan-400' : (isDark ? 'text-gray-500' : 'text-gray-400')
          )} />
        </div>
        <span className={cn(
          'flex-1 text-sm font-medium truncate transition-colors duration-200',
          isHovered ? 'text-cyan-300' : tConfig.text.primary
        )}>
          {task.title}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('text-[11px]', tConfig.text.muted)}>
            {task.items.length} {i18n[isDark ? 'zh' : 'en'].items}
          </span>
          {pendingCount > 0 && (
            <PendingBadge count={pendingCount} theme={theme} onClick={handlePendingClick} />
          )}
        </div>
      </div>
      
      <div className={cn(
        'overflow-hidden transition-all duration-300 ease-out',
        task.isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="flex flex-col gap-2 px-2 pb-2 mt-1">
          {task.items.map((item) => (
            <ReviewItemBubble
              key={item.id}
              item={item}
              theme={theme}
              isSelected={selectedItemId === item.id}
              onClick={() => onSelectItem(task.id, item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// 详情面板中的审核项卡片
const ReviewItemDetailCard: React.FC<{
  item: ReviewItemDetail
  theme: Theme
  lang: Language
  isSelected: boolean
  onSelect: () => void
  onSubmit: (action: 'approve' | 'reject', comment: string) => void
  cardRef?: (element: HTMLDivElement | null) => void
}> = ({ item, theme, lang, isSelected, onSelect, onSubmit, cardRef }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(true)
  const [comment, setComment] = useState('')
  const [showRejectWarning, setShowRejectWarning] = useState(false)
  const tConfig = themeConfig[theme]
  const isDark = theme === 'dark'
  const config = statusConfig[item.status]
  const internalRef = useRef<HTMLDivElement>(null)

  // 合并内部 ref 和外部传入的 ref 回调
  const setRef = (element: HTMLDivElement | null) => {
    internalRef.current = element
    if (cardRef) {
      cardRef(element)
    }
  }

  const handleSubmit = (action: 'approve' | 'reject') => {
    // 打回修改时必须输入审核意见
    if (action === 'reject' && !comment.trim()) {
      setShowRejectWarning(true)
      return
    }
    
    // 即使通过审核，也可以带上评论
    onSubmit(action, comment)
    setComment('')
    setShowRejectWarning(false)
  }
  
  // 输入时隐藏警告
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value)
    if (showRejectWarning && e.target.value.trim()) {
      setShowRejectWarning(false)
    }
  }

  return (
    <div
      ref={setRef}
      className={cn(
        'rounded-xl border transition-all duration-200',
        config.borderColor[theme],
        config.bg[theme],
        isSelected && 'ring-2 ring-cyan-500/50'
      )}
    >
      {/* 卡片头部 - 始终可见 */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dotColor[theme])} />
          <h4 className={cn('text-sm font-medium truncate', tConfig.text.primary)}>{item.title}</h4>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
          <span className={cn('text-[11px]', tConfig.text.time)}>{item.time}</span>
          <StatusTag status={item.status} theme={theme} lang={lang} />
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            isSelected && 'rotate-180',
            tConfig.text.muted
          )} />
        </div>
      </div>

      {/* 展开内容 */}
      {isSelected && (
        <div className="px-3 pb-3 space-y-3 border-t border-inherit">
          {/* 简要总结 */}
          <div className="pt-3">
            <h5 className={cn('text-xs font-medium mb-1.5 flex items-center gap-1.5', tConfig.text.muted)}>
              <MessageSquare className="w-3.5 h-3.5" />
              {i18n[lang].summary}
            </h5>
            <MarkdownRenderer content={item.summary} theme={theme} />
          </div>

          {/* 详细描述 */}
          <div>
            <button
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium transition-colors',
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'
              )}
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isDescExpanded && 'rotate-180')} />
              {isDescExpanded ? i18n[lang].collapseDesc : i18n[lang].expandDesc}
            </button>
            {isDescExpanded && (
              <div className={cn('mt-1.5 p-2.5 rounded-lg border', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200')}>
                <MarkdownRenderer content={item.description} theme={theme} />
              </div>
            )}
          </div>

          {/* 已审核的显示审核意见 */}
          {item.status !== 'pending' && item.reviewComment && (
            <div className={cn('rounded-lg p-2.5 border', 
              item.status === 'approved' 
                ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                : (isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200')
            )}>
              <h5 className={cn('text-xs font-medium mb-1.5 flex items-center gap-1.5',
                item.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'
              )}>
                {item.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {i18n[lang].reviewComment}
              </h5>
              <MarkdownRenderer content={item.reviewComment} theme={theme} />
            </div>
          )}

          {/* 待审核的显示输入框和按钮 */}
          {item.status === 'pending' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className={cn('text-xs font-medium flex items-center gap-1.5', tConfig.text.muted)}>
                  <MessageSquare className="w-3.5 h-3.5" />
                  {i18n[lang].reviewComment}
                </h5>
                <span className={cn('text-[10px]', tConfig.text.time)}>{i18n[lang].markdownHint}</span>
              </div>
              <textarea
                value={comment}
                onChange={handleCommentChange}
                placeholder={i18n[lang].inputPlaceholder}
                className={cn(
                  'w-full h-24 px-3 py-2 rounded-lg text-sm resize-none outline-none transition-colors',
                  tConfig.input,
                  showRejectWarning && 'ring-2 ring-rose-500',
                  isDark ? 'text-gray-200 placeholder:text-gray-500' : 'text-gray-700 placeholder:text-gray-400'
                )}
              />
              {/* 打回修改警告提示 */}
              {showRejectWarning && (
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs',
                  isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
                )}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {i18n[lang].rejectRequireComment}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSubmit('approve')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'bg-emerald-500 hover:bg-emerald-600 text-white'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {i18n[lang].approveBtn}
                </button>
                <button
                  onClick={() => handleSubmit('reject')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isDark 
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30'
                      : 'bg-rose-100 hover:bg-rose-200 text-rose-600 border border-rose-200'
                  )}
                >
                  <RotateCcw className="w-4 h-4" />
                  {i18n[lang].rejectBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 详情面板组件
const DetailPanel: React.FC<{
  task: ReviewTask | null
  selectedItemId: string | null
  theme: Theme
  lang: Language
  onClose: () => void
  onSelectItem: (itemId: string | null) => void
  onSubmit: (taskId: string, itemId: string, action: 'approve' | 'reject', comment: string) => void
}> = ({ task, selectedItemId, theme, lang, onClose, onSelectItem, onSubmit }) => {
  const tConfig = themeConfig[theme]
  const isDark = theme === 'dark'
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevTaskIdRef = useRef<string | undefined>(undefined)
  const prevSelectedItemIdRef = useRef<string | null | undefined>(undefined)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // 统一处理滚动逻辑
  useEffect(() => {
    if (!task) return

    const isTaskChanged = prevTaskIdRef.current !== task.id
    const isItemSelected = !!selectedItemId
    const prevSelection = prevSelectedItemIdRef.current
    const isSelectionChanged = prevSelection !== selectedItemId

    // 任务切换：滚动到顶部，然后如果有选中项则滚动到选中项
    if (isTaskChanged) {
      prevTaskIdRef.current = task.id
      prevSelectedItemIdRef.current = selectedItemId

      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
        }
        // 如果任务切换的同时还有选中项，延迟后再滚动到选中项
        if (isItemSelected) {
          setTimeout(() => {
            const itemElement = itemRefs.current.get(selectedItemId!)
            if (itemElement) {
              // 计算滚动位置，使其距离顶部有一定间距
              const container = scrollContainerRef.current
              if (container) {
                const elementTop = itemElement.offsetTop
                // 减去 6px 的间距，避免显示上一个元素的边框
                container.scrollTo({
                  top: Math.max(0, elementTop - 6),
                  behavior: 'smooth'
                })
              }
            }
          }, 150)
        }
      }, 10)
      return () => clearTimeout(timer)
    }

    // 同一任务内选中项变化：滚动到对应元素
    if (isItemSelected && isSelectionChanged) {
      prevSelectedItemIdRef.current = selectedItemId
      const timer = setTimeout(() => {
        const itemElement = itemRefs.current.get(selectedItemId!)
        if (itemElement) {
          // 计算滚动位置，使其距离顶部有一定间距
          const container = scrollContainerRef.current
          if (container) {
            const elementTop = itemElement.offsetTop
            // 减去 6px 的间距，避免显示上一个元素的边框
            container.scrollTo({
              top: Math.max(0, elementTop - 6),
              behavior: 'smooth'
            })
          }
        }
      }, 50)
      return () => clearTimeout(timer)
    }

    // 更新 prevSelectedItemIdRef（非选中状态变化时）
    if (isSelectionChanged) {
      prevSelectedItemIdRef.current = selectedItemId
    }
  }, [task, selectedItemId])

  // 统计信息
  const stats = task ? {
    total: task.items.length,
    pending: task.items.filter(i => i.status === 'pending').length,
    approved: task.items.filter(i => i.status === 'approved').length,
    changesRequested: task.items.filter(i => i.status === 'changes_requested').length,
  } : { total: 0, pending: 0, approved: 0, changesRequested: 0 }

  return (
    <div className={cn(
      'flex-1 min-h-0 flex flex-col rounded-2xl border overflow-hidden',
      tConfig.container
    )}>
      {task ? (
        <>
          {/* 固定头部区域 - 包含标题和任务信息 */}
          <div className={cn('flex-shrink-0 border-b', tConfig.header)}>
            {/* 任务信息卡片 - 移除边框和背景，调整间距 */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h3 className={cn('text-lg font-semibold leading-tight', tConfig.text.primary)}>{task.title}</h3>
                </div>
                {/* 状态统计 */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0 -mt-1">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className={cn('w-3.5 h-3.5', tConfig.text.muted)} />
                      <span className={tConfig.text.muted}>{i18n[lang].lastActive}: {task.lastActiveTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className={cn('w-3.5 h-3.5', tConfig.text.muted)} />
                      <span className={tConfig.text.muted}>{stats.total} {i18n[lang].reviewCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs', isDark ? 'text-violet-400' : 'text-violet-600')}>{stats.pending}</span>
                      <span className={cn('text-xs', tConfig.text.muted)}>{i18n[lang].pendingLabel}</span>
                      <Eye className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs', isDark ? 'text-emerald-400' : 'text-emerald-600')}>{stats.approved}</span>
                      <span className={cn('text-xs', tConfig.text.muted)}>{i18n[lang].approvedLabel}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs', isDark ? 'text-rose-400' : 'text-rose-600')}>{stats.changesRequested}</span>
                      <span className={cn('text-xs', tConfig.text.muted)}>{i18n[lang].changesRequestedLabel}</span>
                      <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 可滚动的审核项列表区域 */}
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pb-4 pt-2 relative">
            <div className="space-y-2">
              {task.items.map((item, index) => {
                // 如果没有选中项，默认展开第一项
                const isSelected = selectedItemId === item.id || (selectedItemId === null && index === 0)
                return (
                  <ReviewItemDetailCard
                    key={item.id}
                    item={item}
                    theme={theme}
                    lang={lang}
                    isSelected={isSelected}
                    onSelect={() => onSelectItem(isSelected ? null : item.id)}
                    onSubmit={(action, comment) => onSubmit(task.id, item.id, action, comment)}
                    cardRef={(element) => {
                      if (element) {
                        itemRefs.current.set(item.id, element)
                      } else {
                        itemRefs.current.delete(item.id)
                      }
                    }}
                  />
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className={cn('text-sm', tConfig.text.muted)}>{i18n[lang].noSelection}</p>
        </div>
      )}
    </div>
  )
}

// Header组件
const Header: React.FC<{
  lang: Language
  theme: Theme
  onLangChange: (lang: Language) => void
  onThemeChange: (theme: Theme) => void
  notificationEnabled: boolean
  onNotificationChange: (enabled: boolean) => void
}> = ({ lang, theme, onLangChange, onThemeChange, notificationEnabled, onNotificationChange }) => {
  const tConfig = themeConfig[theme]
  const isDark = theme === 'dark'

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b transition-colors duration-300',
      tConfig.headerBg
    )}>
      <div className="flex items-center justify-between h-12 px-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg',
            isDark ? 'bg-gradient-to-br from-cyan-500 to-purple-500' : 'bg-gradient-to-br from-cyan-400 to-purple-500'
          )}>
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <h1 className={cn('text-base font-semibold tracking-tight', tConfig.text.primary)}>
            {i18n[lang].headerTitle}
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Toggle */}
          <button
            onClick={() => onNotificationChange(!notificationEnabled)}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors group',
              tConfig.toolbarBtn
            )}
            title={notificationEnabled ? i18n[lang].notificationOn : i18n[lang].notificationOff}
          >
            {notificationEnabled ? (
              <Bell className={cn('w-3.5 h-3.5 text-gray-500 transition-colors', tConfig.themeIconHover)} />
            ) : (
              <BellOff className={cn('w-3.5 h-3.5 text-gray-500 transition-colors', tConfig.themeIconHover)} />
            )}
            <span className={cn('text-gray-500 transition-colors', tConfig.themeIconHover)}>
              {notificationEnabled ? i18n[lang].notificationOn : i18n[lang].notificationOff}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors group',
              tConfig.toolbarBtn
            )}
          >
            {theme === 'dark' ? (
              <>
                <Sun className={cn('w-3.5 h-3.5 text-gray-500 transition-colors', tConfig.themeIconHover)} />
                <span className={cn('text-gray-500 transition-colors', tConfig.themeIconHover)}>
                  {i18n[lang].lightMode}
                </span>
              </>
            ) : (
              <>
                <Moon className={cn('w-3.5 h-3.5 text-gray-500 transition-colors', tConfig.themeIconHover)} />
                <span className={cn('text-gray-500 transition-colors', tConfig.themeIconHover)}>
                  {i18n[lang].darkMode}
                </span>
              </>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => onLangChange(lang === 'zh' ? 'en' : 'zh')}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors group',
              tConfig.toolbarBtn
            )}
          >
            <Globe className={cn('w-3.5 h-3.5 text-gray-500 transition-colors', tConfig.iconHover)} />
            <span className={cn('text-gray-500 transition-colors', tConfig.iconHover)}>
              {i18n[lang].switchLang}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

// 工具栏
const ToolBar: React.FC<{
  lang: Language
  theme: Theme
  onExpandAll: () => void
  onCollapseAll: () => void
}> = ({ lang, theme, onExpandAll, onCollapseAll }) => {
  const tConfig = themeConfig[theme]

  return (
    <div className={cn('flex items-center justify-between px-4 py-2.5 border-b', tConfig.toolbar)}>
      <span className={cn('text-xs font-medium tracking-wide', tConfig.text.muted)}>
        {i18n[lang].explorer}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onExpandAll}
          className={cn('flex items-center justify-center w-7 h-7 rounded-lg transition-colors group', tConfig.toolbarBtn)}
          title={i18n[lang].expandAll}
        >
          <ChevronsDown className={cn('w-3.5 h-3.5 text-gray-500 transition-colors', tConfig.iconHover)} />
        </button>
        <button
          onClick={onCollapseAll}
          className={cn('flex items-center justify-center w-7 h-7 rounded-lg transition-colors group', tConfig.toolbarBtn)}
          title={i18n[lang].collapseAll}
        >
          <ChevronsUp className={cn('w-3.5 h-3.5 text-gray-500 transition-colors', tConfig.iconHover)} />
        </button>
      </div>
    </div>
  )
}

// 主页面组件
export default function Home() {
  const [lang, setLang] = useState<Language>('zh')
  const [theme, setTheme] = useState<Theme>('dark')
  const [tasks, setTasks] = useState<ReviewTask[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const prevPendingCountRef = useRef(0)
  const tConfig = themeConfig[theme]
  
  const { sessions, isLoading, mutate } = useReviewSessions()
  const { toast } = useToast()

  // Load settings from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('review-center-lang') as Language
    const savedTheme = localStorage.getItem('review-center-theme') as Theme
    const savedNotification = localStorage.getItem('review-center-notification')
    
    if (savedLang) setLang(savedLang)
    if (savedTheme) setTheme(savedTheme)
    if (savedNotification !== null) {
      setNotificationEnabled(savedNotification === 'true')
    } else {
      // Default to true if not set
      setNotificationEnabled(true)
    }
  }, [])

  // Save settings handlers
  const handleLangChange = (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem('review-center-lang', newLang)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('review-center-theme', newTheme)
  }

  // Notification toggle handler
  const handleNotificationChange = async (enabled: boolean) => {
    if (enabled) {
      if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification')
        return
      }
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationEnabled(true)
        localStorage.setItem('review-center-notification', 'true')
      }
    } else {
      setNotificationEnabled(false)
      localStorage.setItem('review-center-notification', 'false')
    }
  }

  // Effect for checking new tasks and sending notification
  useEffect(() => {
    // Wait until tasks are loaded to avoid initial notification
    if (tasks.length === 0) return

    const currentPendingCount = tasks.reduce((acc, task) => {
      return acc + task.items.filter(item => item.status === 'pending').length
    }, 0)

    // Load previous count from localStorage on first run
    if (prevPendingCountRef.current === 0) {
      const savedCount = localStorage.getItem('review-center-pending-count')
      if (savedCount) {
        prevPendingCountRef.current = parseInt(savedCount, 10)
      } else {
        // First time ever, set current count as baseline to avoid notification
        prevPendingCountRef.current = currentPendingCount
        localStorage.setItem('review-center-pending-count', currentPendingCount.toString())
        return
      }
    }

    // Only notify if there are new pending items (count increased)
    if (notificationEnabled && currentPendingCount > prevPendingCountRef.current) {
      const diff = currentPendingCount - prevPendingCountRef.current
      // New pending items arrived
      const notification = new Notification('Review Center', {
        body: diff === 1 ? 'New pending review item arrived' : `${diff} new pending review items arrived`,
      })
      
      notification.onclick = () => {
        window.focus()
        
        // Find the first task with pending items
        const firstPendingTask = tasks.find(task => task.items.some(item => item.status === 'pending'))
        if (firstPendingTask) {
          // Find the first pending item in that task
          const firstPendingItem = firstPendingTask.items.find(item => item.status === 'pending')
          if (firstPendingItem) {
            // Expand the task if needed
            if (!firstPendingTask.isExpanded) {
              setTasks(prev => prev.map(t => 
                t.id === firstPendingTask.id ? { ...t, isExpanded: true } : t
              ))
            }
            // Select the task and item
            setSelectedTaskId(firstPendingTask.id)
            setSelectedItemId(firstPendingItem.id)
          }
        }
      }
    }
    
    // Update ref and localStorage
    if (currentPendingCount !== prevPendingCountRef.current) {
      prevPendingCountRef.current = currentPendingCount
      localStorage.setItem('review-center-pending-count', currentPendingCount.toString())
    }
  }, [tasks, notificationEnabled])
  
  // 将 API 返回的 sessions 转换为 UI 需要的 ReviewTask 结构
  useEffect(() => {
    if (isLoading) return

    const groupedTasks: Record<string, ReviewTask> = {}

    sessions.forEach(session => {
      // 映射状态
      let status: ReviewStatus = 'pending'
      if (session.status === 'approved') status = 'approved'
      if (session.status === 'needs_revision') status = 'changes_requested'

      const item: ReviewItemDetail = {
        id: session.sessionId,
        title: session.title,
        status,
        time: formatDistanceToNow(session.updatedAt, { 
          addSuffix: true, 
          locale: lang === 'zh' ? zhCN : enUS 
        }),
        summary: session.summary,
        description: session.details,
        reviewComment: session.feedback,
        rawSession: session
      }

      if (!groupedTasks[session.taskId]) {
        groupedTasks[session.taskId] = {
          id: session.taskId,
          title: session.taskTitle || session.taskId,
          lastActiveTime: formatDistanceToNow(session.updatedAt, { 
            addSuffix: true, 
            locale: lang === 'zh' ? zhCN : enUS 
          }),
          items: [],
          isExpanded: false, // 默认不展开
          lastTimestamp: session.updatedAt
        }
      } else {
        // 更新最后活跃时间
        if (session.updatedAt > groupedTasks[session.taskId].lastTimestamp) {
          groupedTasks[session.taskId].lastTimestamp = session.updatedAt
          groupedTasks[session.taskId].lastActiveTime = formatDistanceToNow(session.updatedAt, { 
            addSuffix: true, 
            locale: lang === 'zh' ? zhCN : enUS 
          })
        }
      }

      groupedTasks[session.taskId].items.push(item)
    })

    // 转换为数组并排序
    const sortedTasks = Object.values(groupedTasks).sort((a, b) => b.lastTimestamp - a.lastTimestamp)
    
    // 保持原来的展开状态
    setTasks(prev => {
      const expandedMap = new Set(prev.filter(t => t.isExpanded).map(t => t.id))
      return sortedTasks.map(t => ({
        ...t,
        isExpanded: prev.length === 0 ? false : expandedMap.has(t.id) // 第一次加载不展开，之后保持状态
      }))
    })

  }, [sessions, lang, isLoading])

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, isExpanded: !task.isExpanded } : task
    ))
  }

  const expandAll = () => setTasks(tasks.map(task => ({ ...task, isExpanded: true })))
  const collapseAll = () => setTasks(tasks.map(task => ({ ...task, isExpanded: false })))

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setSelectedItemId(null) // 清空选中的审核项
  }

  const handleSelectItem = (taskId: string, itemId: string) => {
    setSelectedTaskId(taskId)
    setSelectedItemId(itemId)
  }

  const handleSelectPending = (taskId: string, itemId: string) => {
    setSelectedTaskId(taskId)
    setSelectedItemId(itemId)
  }

  const handleDetailSelectItem = (itemId: string | null) => {
    setSelectedItemId(itemId)
  }

  const handleCloseDetail = () => {
    setSelectedTaskId(null)
    setSelectedItemId(null)
  }

  const handleSubmit = async (taskId: string, itemId: string, action: 'approve' | 'reject', comment: string) => {
    try {
      const status = action === 'approve' ? 'approved' : 'needs_revision'
      await submitFeedback(itemId, status, comment)
      
      // 重新获取数据
      mutate()
      
    } catch (error) {
      console.error('Submit review failed:', error)
      toast({
        title: i18n[lang].submitError,
        description: String(error),
        variant: "destructive",
      })
    }
  }

  return (
    <div className={cn('h-screen flex flex-col overflow-hidden transition-colors duration-300', tConfig.pageBg)}>
      {/* Header */}
      <Header
        lang={lang}
        theme={theme}
        onLangChange={handleLangChange}
        onThemeChange={handleThemeChange}
        notificationEnabled={notificationEnabled}
        onNotificationChange={handleNotificationChange}
      />

      {/* Main Content */}
      <main className="flex-1 flex gap-2 p-2 min-h-0">
        {/* Left Sidebar */}
        <aside className={cn(
          'w-[340px] flex-shrink-0 rounded-2xl border shadow-xl overflow-hidden transition-colors duration-300 flex flex-col',
          tConfig.sidebar
        )}>
          {/* Toolbar */}
          <ToolBar 
            lang={lang}
            theme={theme}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />

          {/* Review List */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {isLoading ? (
               <div className="flex justify-center p-4 text-sm text-gray-500">{i18n[lang].loading}</div>
            ) : tasks.length === 0 ? (
               <div className="flex justify-center p-4 text-sm text-gray-500">{i18n[lang].noTasks}</div>
            ) : (
              <div className="py-3 px-2 space-y-1">
                {tasks.map((task) => (
                  <ReviewTaskComponent
                    key={task.id}
                    task={task}
                    theme={theme}
                    selectedTaskId={selectedTaskId}
                    selectedItemId={selectedItemId}
                    onToggle={toggleTask}
                    onSelectTask={handleSelectTask}
                    onSelectItem={handleSelectItem}
                    onSelectPending={handleSelectPending}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Detail Panel */}
        <DetailPanel
          task={selectedTask}
          selectedItemId={selectedItemId}
          theme={theme}
          lang={lang}
          onClose={handleCloseDetail}
          onSelectItem={handleDetailSelectItem}
          onSubmit={handleSubmit}
        />
      </main>

      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={cn('absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl', tConfig.decoration[0])} />
        <div className={cn('absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl', tConfig.decoration[1])} />
      </div>

      {/* Custom Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${tConfig.scrollbarThumb};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${tConfig.scrollbarThumbHover};
        }
      `}</style>
    </div>
  )
}
