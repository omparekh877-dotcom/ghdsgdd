import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Search, Users, MessageSquare, Hash, Bell, MoreVertical, UserPlus, UserMinus, Edit, Trash2, File, Image, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService, ChatChannel, ChatMessage } from '@/lib/chat-service';
import { staffService, StaffMember } from '@/lib/staff-service';
import { authService } from '@/lib/auth-service';

interface CreateChannelFormData {
  name: string;
  type: 'direct' | 'group' | 'announcement';
  members: string[];
  description: string;
}

export default function InternalChat() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [createChannelForm, setCreateChannelForm] = useState<CreateChannelFormData>({
    name: '',
    type: 'group',
    members: [],
    description: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = authService.getCurrentUser();
  const canCreateAnnouncements = authService.hasPermission('manage_team');

  useEffect(() => {
    loadChannels();
    loadStaff();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
    }
  }, [selectedChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChannels = () => {
    const channelList = chatService.getChannels();
    setChannels(channelList);
    
    // Auto-select first channel if none selected
    if (!selectedChannel && channelList.length > 0) {
      setSelectedChannel(channelList[0]);
    }
  };

  const loadStaff = () => {
    const staffList = staffService.getStaffList();
    setStaff(staffList);
  };

  const loadMessages = () => {
    if (!selectedChannel) return;
    
    const messageList = chatService.getChannelMessages(selectedChannel.id);
    setMessages(messageList);
    
    // Mark messages as read
    messageList.forEach(message => {
      if (message.senderId !== user?.id) {
        chatService.markMessageAsRead(message.id);
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChannel || !newMessage.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await chatService.sendMessage(selectedChannel.id, {
        content: newMessage.trim(),
        type: 'text'
      });

      if (result.success) {
        setNewMessage('');
        loadMessages();
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await chatService.createChannel(createChannelForm);
      
      if (result.success) {
        loadChannels();
        setIsCreateChannelOpen(false);
        resetCreateChannelForm();
        if (result.channel) {
          setSelectedChannel(result.channel);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDirectChannel = async (staffId: string) => {
    setIsLoading(true);
    try {
      const result = await chatService.createDirectChannel(staffId);
      if (result.success) {
        loadChannels();
        if (result.channel) {
          setSelectedChannel(result.channel);
        }
      }
    } catch (error) {
      console.error('Failed to create direct channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMemberToChannel = async (staffId: string) => {
    if (!selectedChannel) return;
    
    const result = await chatService.addMemberToChannel(selectedChannel.id, staffId);
    if (result.success) {
      loadChannels();
      loadMessages();
      setIsAddMemberOpen(false);
    }
  };

  const handleRemoveMemberFromChannel = async (staffId: string) => {
    if (!selectedChannel) return;
    
    const result = await chatService.removeMemberFromChannel(selectedChannel.id, staffId);
    if (result.success) {
      loadChannels();
      loadMessages();
    }
  };

  const resetCreateChannelForm = () => {
    setCreateChannelForm({
      name: '',
      type: 'group',
      members: [],
      description: ''
    });
    setError('');
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Bell className="h-4 w-4" />;
      case 'direct':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'text-red-600';
      case 'direct':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getUnreadCount = (channelId: string) => {
    return chatService.getUnreadCount(channelId);
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableStaffForChannel = staff.filter(staffMember => 
    !selectedChannel?.members.includes(staffMember.id) && 
    staffMember.id !== user?.id
  );

  const channelMembers = selectedChannel ? 
    staff.filter(staffMember => selectedChannel.members.includes(staffMember.id)) : 
    [];

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to access the chat system.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 min-h-screen">
      <div className="flex flex-col md:flex-row h-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Sidebar - Channels */}
        <div className="w-full md:w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Team Chat</h2>
              <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetCreateChannelForm}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Channel</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateChannel} className="space-y-4">
                    {error && (
                      <Alert>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Label htmlFor="channelName">Channel Name</Label>
                      <Input
                        id="channelName"
                        value={createChannelForm.name}
                        onChange={(e) => setCreateChannelForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Sales Team"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="channelType">Channel Type</Label>
                      <Select 
                        value={createChannelForm.type} 
                        onValueChange={(value: any) => setCreateChannelForm(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">Group Chat</SelectItem>
                          {canCreateAnnouncements && (
                            <SelectItem value="announcement">Announcement Channel</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="channelDescription">Description (Optional)</Label>
                      <Textarea
                        id="channelDescription"
                        value={createChannelForm.description}
                        onChange={(e) => setCreateChannelForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="What's this channel about?"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Add Members</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {staff.filter(s => s.id !== user.id).map(staffMember => (
                          <label key={staffMember.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={createChannelForm.members.includes(staffMember.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCreateChannelForm(prev => ({
                                    ...prev,
                                    members: [...prev.members, staffMember.id]
                                  }));
                                } else {
                                  setCreateChannelForm(prev => ({
                                    ...prev,
                                    members: prev.members.filter(id => id !== staffMember.id)
                                  }));
                                }
                              }}
                            />
                            <span className="text-sm">{staffMember.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateChannelOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Channel'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredChannels.map((channel) => {
                const unreadCount = getUnreadCount(channel.id);
                return (
                  <div
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedChannel?.id === channel.id ? 'bg-blue-100 border-blue-300' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className={getChannelTypeColor(channel.type)}>
                          {getChannelIcon(channel.type)}
                        </div>
                        <span className="font-medium truncate">{channel.name}</span>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    {channel.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{channel.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {channel.members.length} member{channel.members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Direct Message Section */}
          <div className="border-t p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick DM</h3>
            <div className="space-y-1">
              {staff.filter(s => s.id !== user.id).slice(0, 5).map(staffMember => (
                <button
                  key={staffMember.id}
                  onClick={() => handleCreateDirectChannel(staffMember.id)}
                  className="w-full text-left p-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-blue-600">
                      {staffMember.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="truncate">{staffMember.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={getChannelTypeColor(selectedChannel.type)}>
                    {getChannelIcon(selectedChannel.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedChannel.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChannel.members.length} member{selectedChannel.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedChannel.type !== 'direct' && (
                    <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Members to {selectedChannel.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {availableStaffForChannel.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">All staff members are already in this channel</p>
                          ) : (
                            availableStaffForChannel.map(staffMember => (
                              <div key={staffMember.id} className="flex items-center justify-between p-2 border rounded">
                                <span>{staffMember.name}</span>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddMemberToChannel(staffMember.id)}
                                >
                                  Add
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Users className="h-4 w-4 mr-2" />
                        View Members ({channelMembers.length})
                      </DropdownMenuItem>
                      {selectedChannel.createdBy === user.id && (
                        <>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Channel
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Channel
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pb-24 md:pb-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${
                        message.senderId === user.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg p-3`}>
                        {message.senderId !== user.id && (
                          <div className="text-xs font-medium mb-1 opacity-70">
                            {message.senderName}
                          </div>
                        )}
                        <div className="break-words">{message.content}</div>
                        <div className={`text-xs mt-1 opacity-70 ${
                          message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                          {message.isEdited && ' (edited)'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-white sticky bottom-0 z-10">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedChannel.name}...`}
                      rows={1}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button type="submit" size="sm" disabled={!newMessage.trim() || isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  // Handle file upload here
                  console.log('Files selected:', e.target.files);
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a channel</h3>
                <p className="text-gray-500">Choose a channel from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
