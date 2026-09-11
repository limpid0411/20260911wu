import React, { useState, useEffect } from 'react';
import {
  Utensils, ShoppingBag, Plus, Clock, CheckCircle2, XCircle,
  Store, Phone, DollarSign, User as UserIcon, Trash2, AlertCircle,
  Coffee, Check, Lock, Unlock
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import {
  LunchOrder, LunchRestaurant, LunchMenuItem, LunchOrderItem, LunchOrderStatus, User
} from '../../types/pms';

export const LunchOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<LunchOrder[]>([]);
  const [restaurants, setRestaurants] = useState<LunchRestaurant[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderRestaurantId, setNewOrderRestaurantId] = useState('');
  const [newOrderCutoff, setNewOrderCutoff] = useState('11:30');

  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNote, setItemNote] = useState('');

  const [newRestName, setNewRestName] = useState('');
  const [newRestPhone, setNewRestPhone] = useState('');
  const [newRestCategory, setNewRestCategory] = useState('便當簡餐');
  const [newMenuItemsText, setNewMenuItemsText] = useState('招牌排骨飯:110, 酥炸雞腿飯:120, 古早味紅茶:25');

  useEffect(() => {
    const updateState = () => {
      const allOrders = storageService.getLunchOrders();
      const allRest = storageService.getLunchRestaurants();
      setOrders(allOrders);
      setRestaurants(allRest);
      const users = storageService.getUsers();
      const current = storageService.getCurrentUser();
      setCurrentUser(current || users[0] || null);
      if (allOrders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(allOrders[0].id);
      }
    };
    updateState();
    const unsubscribe = storageService.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  const activeRestaurant = activeOrder ? restaurants.find((r) => r.id === activeOrder.restaurant_id) : null;
  const activeOrdersCount = orders.filter((o) => o.status === 'OPEN').length;
  const totalItemsOrdered = orders.reduce((sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.price * item.quantity, 0), 0);
  const unpaidAmount = orders.reduce((sum, o) => sum + o.items.filter((i) => !i.is_paid).reduce((iSum, item) => iSum + item.price * item.quantity, 0), 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderRestaurantId) return;
    const rest = restaurants.find((r) => r.id === newOrderRestaurantId);
    const title = newOrderTitle || `${new Date().toLocaleDateString('zh-TW')} ${rest?.name || ''}團購`;
    await storageService.createLunchOrder({
      title,
      restaurant_id: newOrderRestaurantId,
      cutoff_time: newOrderCutoff,
      created_by: currentUser?.full_name || '同仁'
    });
    setNewOrderTitle('');
    setShowNewOrderModal(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedMenuItemId || !activeRestaurant) return;
    if (activeOrder.status !== 'OPEN') {
      alert('該團購單已截止或已下單，無法新增餐點！');
      return;
    }
    const menuItem = activeRestaurant.menu_items.find((m) => m.id === selectedMenuItemId);
    if (!menuItem) return;
    await storageService.addLunchOrderItem(activeOrder.id, {
      user_id: currentUser?.id || 'u_guest',
      user_name: currentUser?.full_name || '同仁',
      item_name: menuItem.name,
      price: menuItem.price,
      quantity: Number(itemQuantity),
      note: itemNote,
      is_paid: false
    });
    setSelectedMenuItemId('');
    setItemQuantity(1);
    setItemNote('');
  };

  const handleTogglePaid = async (itemId: string, currentPaid: boolean) => {
    await storageService.toggleLunchItemPaid(itemId, !currentPaid);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('確定要刪除這筆點餐項目嗎？')) {
      await storageService.deleteLunchOrderItem(itemId);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: LunchOrderStatus) => {
    await storageService.updateLunchOrderStatus(orderId, newStatus);
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName) return;
    const parsedMenuItems: LunchMenuItem[] = newMenuItemsText
      .split(',')
      .map((pair, idx) => {
        const [name, priceStr] = pair.split(':');
        return {
          id: `m_custom_${Date.now()}_${idx}`,
          name: name ? name.trim() : '自訂餐點',
          price: priceStr ? parseInt(priceStr.trim(), 10) || 50 : 50
        };
      })
      .filter((m) => m.name);

    await storageService.createLunchRestaurant({
      id: `r_${Date.now()}`,
      name: newRestName,
      phone: newRestPhone,
      category: newRestCategory,
      menu_items: parsedMenuItems
    });

    setNewRestName('');
    setNewRestPhone('');
    setShowRestaurantModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <Utensils className="w-8 h-8 text-amber-100 animate-bounce" />
            <h1 className="text-2xl font-bold tracking-tight">午餐與手搖飲團購管理</h1>
            <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md">
              feat/lunch-order
            </span>
          </div>
          <p className="text-amber-100 text-sm">
            工程團隊每日午餐便當與手搖飲點餐系統 · 自動計算小計金額與對帳追蹤
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRestaurantModal(true)}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-medium transition backdrop-blur-sm border border-white/20"
          >
            <Store className="w-4 h-4" />
            <span>店家與菜單庫</span>
          </button>
          <button
            onClick={() => {
              if (restaurants.length > 0) {
                setNewOrderRestaurantId(restaurants[0].id);
              }
              setShowNewOrderModal(true);
            }}
            className="flex items-center space-x-2 bg-white text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-xl font-semibold shadow-md transition"
          >
            <Plus className="w-5 h-5" />
            <span>發起午餐/飲料團購</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">登記中團購</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {activeOrdersCount} <span className="text-xs font-normal text-slate-500">個活動</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">累積訂購份數</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {totalItemsOrdered} <span className="text-xs font-normal text-slate-500">份餐點</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">總訂購金額</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              ${totalAmount} <span className="text-xs font-normal text-slate-500">TWD</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">待結清代墊款</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              ${unpaidAmount} <span className="text-xs font-normal text-slate-500">未收到</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">
            團購活動列表 ({orders.length})
          </h2>
          <div className="space-y-2">
            {orders.map((o) => {
              const isSelected = o.id === (activeOrder?.id || '');
              const itemCount = o.items.reduce((acc, item) => acc + item.quantity, 0);
              const orderTotal = o.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-orange-50 border-orange-300 dark:bg-amber-950/30 dark:border-amber-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          o.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : o.status === 'CLOSED'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {o.status === 'OPEN' ? '登記中' : o.status === 'CLOSED' ? '截止登記' : '下單完成'}
                      </span>
                      <span className="text-xs text-slate-400">{o.date}</span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                      {o.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                      <span>店家: {o.restaurant_name}</span>
                      <span>•</span>
                      <span>截止: {o.cutoff_time}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      ${orderTotal}
                    </div>
                    <div className="text-xs text-slate-400">{itemCount} 份餐點</div>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                目前尚無發起的團購活動
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeOrder ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 gap-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      {activeOrder.title}
                    </h2>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        activeOrder.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : activeOrder.status === 'CLOSED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {activeOrder.status === 'OPEN'
                        ? '🟢 開放登記中'
                        : activeOrder.status === 'CLOSED'
                        ? '🟡 已截止登記'
                        : '🔒 已向店家完成下單'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Store className="w-3.5 h-3.5 text-amber-500" />
                      <span>{activeOrder.restaurant_name}</span>
                    </span>
                    {activeOrder.restaurant_phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span>電話: {activeOrder.restaurant_phone}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>訂購截止: {activeOrder.cutoff_time}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <UserIcon className="w-3.5 h-3.5 text-purple-500" />
                      <span>發起人: {activeOrder.created_by}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {activeOrder.status === 'OPEN' && (
                    <button
                      onClick={() => handleStatusChange(activeOrder.id, 'CLOSED')}
                      className="flex items-center space-x-1 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 text-xs px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 font-medium transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>截止登記</span>
                    </button>
                  )}
                  {activeOrder.status === 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange(activeOrder.id, 'ORDERED')}
                      className="flex items-center space-x-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>向店家下單</span>
                    </button>
                  )}
                  {activeOrder.status !== 'OPEN' && (
                    <button
                      onClick={() => handleStatusChange(activeOrder.id, 'OPEN')}
                      className="flex items-center space-x-1 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>重新開放</span>
                    </button>
                  )}
                </div>
              </div>

              {activeOrder.status === 'OPEN' ? (
                <form
                  onSubmit={handleAddItem}
                  className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 space-y-3"
                >
                  <div className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>同仁線上點餐 / 加點</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        選擇餐點
                      </label>
                      <select
                        value={selectedMenuItemId}
                        onChange={(e) => setSelectedMenuItemId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm p-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        required
                      >
                        <option value="">-- 請選擇菜單品項 --</option>
                        {activeRestaurant?.menu_items.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (${m.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        數量
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm p-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        客製化備註 (冰塊/甜度/辣度)
                      </label>
                      <input
                        type="text"
                        placeholder="例：飯少、去冰微糖、加辣..."
                        value={itemNote}
                        onChange={(e) => setItemNote(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm p-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!selectedMenuItemId}
                      className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm shadow-sm transition flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>確認點餐 (${selectedMenuItemId ? (activeRestaurant?.menu_items.find(m => m.id === selectedMenuItemId)?.price || 0) * itemQuantity : 0})</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                  🔒 該團購單已截止，暫不開放線上新增點餐。發起人可隨時重新開放登記。
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    <span>點餐明細與對帳狀態 ({activeOrder.items.length} 筆)</span>
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="p-3">點餐同仁</th>
                        <th className="p-3">餐點名稱</th>
                        <th className="p-3">單價</th>
                        <th className="p-3">數量</th>
                        <th className="p-3">小計</th>
                        <th className="p-3">客製化備註</th>
                        <th className="p-3 text-center">付款狀態</th>
                        <th className="p-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm text-slate-700 dark:text-slate-200">
                      {activeOrder.items.map((item) => {
                        const subtotal = item.price * item.quantity;
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition"
                          >
                            <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                              {item.user_name}
                            </td>
                            <td className="p-3">{item.item_name}</td>
                            <td className="p-3 text-slate-500">${item.price}</td>
                            <td className="p-3 font-semibold">{item.quantity}</td>
                            <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                              ${subtotal}
                            </td>
                            <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                              {item.note || '-'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleTogglePaid(item.id, item.is_paid)}
                                className={`text-xs px-3 py-1 rounded-full font-semibold transition inline-flex items-center space-x-1 ${
                                  item.is_paid
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                                }`}
                              >
                                {item.is_paid ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>已付款</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    <span>未付款</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 transition p-1"
                                title="刪除明細"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {activeOrder.items.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-8 text-center text-slate-400 text-sm"
                          >
                            尚無同仁點餐，快選擇餐點加單吧！
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center text-slate-400 border border-slate-200 dark:border-slate-700">
              請從左側選擇一個團購活動檢視明細
            </div>
          )}
        </div>
      </div>

      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                <span>發起午餐/飲料團購</span>
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  團購主題名稱
                </label>
                <input
                  type="text"
                  placeholder="例：9/11 團隊午餐排骨便當團"
                  value={newOrderTitle}
                  onChange={(e) => setNewOrderTitle(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2.5 text-sm dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  選擇合作店家
                </label>
                <select
                  value={newOrderRestaurantId}
                  onChange={(e) => setNewOrderRestaurantId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2.5 text-sm dark:text-slate-100"
                  required
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.category} - {r.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  訂購截止時間
                </label>
                <input
                  type="time"
                  value={newOrderCutoff}
                  onChange={(e) => setNewOrderCutoff(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg p-2.5 text-sm dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  發起團購
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRestaurantModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Store className="w-5 h-5 text-blue-500" />
                <span>合作店家與菜單庫管理</span>
              </h3>
              <button
                onClick={() => setShowRestaurantModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                現有店家與菜單列表
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {restaurants.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-100">
                      <span>{r.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        {r.category}
                      </span>
                    </div>
                    <div className="text-slate-500">電話: {r.phone || '無'}</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      菜單: {r.menu_items.map((m) => `${m.name}($${m.price})`).join('、 ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleAddRestaurant}
              className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3"
            >
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span>新增店家與菜單</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">店家名稱</label>
                  <input
                    type="text"
                    placeholder="例：鼎泰豐"
                    value={newRestName}
                    onChange={(e) => setNewRestName(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">聯絡電話</label>
                  <input
                    type="text"
                    placeholder="例：02-12345678"
                    value={newRestPhone}
                    onChange={(e) => setNewRestPhone(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">分類</label>
                  <select
                    value={newRestCategory}
                    onChange={(e) => setNewRestCategory(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="便當簡餐">便當簡餐</option>
                    <option value="手搖飲料">手搖飲料</option>
                    <option value="麵食小吃">麵食小吃</option>
                    <option value="異國料理">異國料理</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  菜單品項與價格 (格式：品名:價格, 品名:價格)
                </label>
                <input
                  type="text"
                  placeholder="例：排骨飯:110, 雞腿飯:120, 紅茶:25"
                  value={newMenuItemsText}
                  onChange={(e) => setNewMenuItemsText(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestaurantModal(false)}
                  className="px-4 py-2 text-sm text-slate-500"
                >
                  關閉
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700"
                >
                  儲存店家與菜單
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
