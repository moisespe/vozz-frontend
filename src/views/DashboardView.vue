<template>
    <div class="h-screen bg-background flex flex-col lg:flex-row overflow-hidden" :class="{'animate-shake': globalBuzz}">
    <!-- Flash overlay para zumbido -->
    <div v-if="globalBuzz" class="fixed inset-0 z-50 pointer-events-none animate-buzz-flash"></div>

    <!-- ============ CONTENIDO PRINCIPAL ============ -->
    <main class="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
      <!-- Modales -->
      <div v-if="showNewCallModal" class="fixed inset-0 bg-black/60 flex items-end lg:items-center justify-center z-50" @click.self="showNewCallModal = false">
        <div class="w-full lg:max-w-sm bg-card rounded-t-2xl lg:rounded-xl border border-input p-6 mx-0 lg:mx-4 shadow-2xl max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4 lg:hidden"><h3 class="text-lg font-semibold text-foreground">Nueva Llamada</h3><button @click="showNewCallModal=false" class="text-muted-foreground text-xl leading-none">&times;</button></div>
          <h3 class="hidden lg:block text-lg font-semibold text-foreground mb-4">Nueva Llamada</h3>
          <p class="text-sm text-muted-foreground mb-4">Selecciona un contacto</p>
          <div class="space-y-1 max-h-64 overflow-y-auto">
            <div v-for="contact in callStore.contacts" :key="contact.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              @click="callContact(contact); showNewCallModal=false">
              <div class="relative shrink-0">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{{ contact.name.charAt(0).toUpperCase() }}</div>
                <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" :class="contact.online?'bg-green-500':'bg-muted-foreground'"></span>
              </div>
              <div class="min-w-0 flex-1"><p class="text-sm font-medium text-foreground truncate">{{ contact.name }}</p><p class="text-xs" :class="contact.online?'text-green-400':'text-muted-foreground'">{{ contact.online ? 'En línea' : contact.lastSeen }}</p></div>
            </div>
          </div>
          <button @click="showNewCallModal=false" class="hidden lg:block w-full mt-4 text-sm text-muted-foreground hover:text-foreground py-2 transition-colors">Cancelar</button>
        </div>
      </div>

      <div v-if="showHistoryModal" class="fixed inset-0 bg-black/60 flex items-end lg:items-center justify-center z-50" @click.self="showHistoryModal=false">
        <div class="w-full lg:max-w-lg bg-card rounded-t-2xl lg:rounded-xl border border-input p-6 mx-0 lg:mx-4 shadow-2xl max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold text-foreground">Historial</h3><button @click="showHistoryModal=false" class="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button></div>
          <div class="flex-1 overflow-y-auto space-y-2">
            <div v-for="call in recentCalls" :key="call.id" class="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{{ (call.callerName||'?').charAt(0).toUpperCase() }}</div>
                <div><p class="text-sm font-medium text-foreground">{{ call.callerName||'Desconocido' }}</p><p class="text-xs text-muted-foreground">{{ formatDate(call.createdAt) }} · {{ statusLabel(call.status) }}</p></div>
              </div>
              <span class="text-xs text-muted-foreground">{{ call.duration?formatDuration(call.duration):'' }}</span>
            </div>
            <div v-if="recentCalls.length===0" class="text-center py-10 text-muted-foreground text-sm">No hay llamadas registradas.</div>
          </div>
        </div>
      </div>

      <div v-if="showSettingsModal" class="fixed inset-0 bg-black/60 flex items-end lg:items-center justify-center z-50" @click.self="showSettingsModal=false">
        <div class="w-full lg:max-w-md bg-card rounded-t-2xl lg:rounded-xl border border-input p-0 mx-0 lg:mx-4 shadow-2xl max-h-[85vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
            <h3 class="text-lg font-semibold text-foreground">Configuración</h3>
            <button @click="showSettingsModal=false" class="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 px-6 mt-4 border-b border-input shrink-0">
            <button @click="settingsTab='profile'" class="px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px" :class="settingsTab==='profile'?'border-primary text-foreground':'border-transparent text-muted-foreground hover:text-foreground'">Perfil</button>
            <button @click="settingsTab='appearance'" class="px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px" :class="settingsTab==='appearance'?'border-primary text-foreground':'border-transparent text-muted-foreground hover:text-foreground'">Apariencia</button>
            <button @click="settingsTab='devices'" class="px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px" :class="settingsTab==='devices'?'border-primary text-foreground':'border-transparent text-muted-foreground hover:text-foreground'">Dispositivos</button>
            <button @click="settingsTab='notifications'" class="px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px" :class="settingsTab==='notifications'?'border-primary text-foreground':'border-transparent text-muted-foreground hover:text-foreground'">Notificaciones</button>
          </div>
          <!-- Contenido scrollable -->
          <div class="overflow-y-auto px-6 py-5 space-y-4">

            <!-- TAB: Perfil -->
            <div v-if="settingsTab==='profile'" class="space-y-4">
              <div class="flex items-center gap-4 mb-2">
                <div class="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                  {{ profileNickname ? profileNickname.charAt(0).toUpperCase() : (loggedEmail.charAt(0).toUpperCase() || '?') }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-foreground">{{ profileNickname || loggedName || 'Sin nickname' }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ loggedEmail }}</p>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-muted-foreground mb-1.5">Nickname</label>
                <input type="text" v-model="profileNickname" placeholder="Tu nombre visible"
                  class="w-full px-3.5 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
              </div>
              <div>
                <label class="block text-sm font-medium text-muted-foreground mb-1.5">Descripción</label>
                <textarea rows="3" v-model="profileDescription" placeholder="Cuéntanos sobre ti..."
                  class="w-full px-3.5 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"></textarea>
              </div>
              <button @click="saveProfile" class="w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
                {{ profileSaved ? 'Guardado' : 'Guardar Perfil' }}
              </button>
              <div class="text-xs text-muted-foreground text-center">Rol: Administrador · Versión: Vozz v1.0.0</div>
              <button @click="installApp" v-if="showInstall" class="w-full py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">Instalar app</button>
            </div>

            <!-- TAB: Apariencia -->
            <div v-if="settingsTab==='appearance'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-muted-foreground mb-3">Tema de la interfaz</label>
                <div class="flex gap-2">
                  <button @click="setTheme('dark')" class="flex-1 px-3.5 py-3 rounded-xl text-sm font-medium border transition-colors" :class="currentTheme==='dark'?'bg-primary text-primary-foreground border-transparent ring-2 ring-primary/30':'bg-accent text-muted-foreground border-input hover:text-foreground'">Oscuro</button>
                  <button @click="setTheme('light')" class="flex-1 px-3.5 py-3 rounded-xl text-sm font-medium border transition-colors" :class="currentTheme==='light'?'bg-primary text-primary-foreground border-transparent ring-2 ring-primary/30':'bg-accent text-muted-foreground border-input hover:text-foreground'">Claro</button>
                  <button @click="setTheme('contrast')" class="flex-1 px-3.5 py-3 rounded-xl text-sm font-medium border transition-colors" :class="currentTheme==='contrast'?'bg-primary text-primary-foreground border-transparent ring-2 ring-primary/30':'bg-accent text-muted-foreground border-input hover:text-foreground'">Alto</button>
                </div>
              </div>
              <div class="bg-accent/30 rounded-xl p-4">
                <p class="text-xs text-muted-foreground">El tema seleccionado se guarda automáticamente y persiste entre sesiones.</p>
              </div>
            </div>

            <!-- TAB: Dispositivos -->
            <div v-if="settingsTab==='devices'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-muted-foreground mb-3">Dispositivos de audio</label>
                <button @click="requestAudioPermissions" :disabled="permLoading"
                  class="w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 mb-4">
                  {{ permLoading ? 'Solicitando...' : 'Solicitar permisos de audio' }}
                </button>
              </div>
              <div v-if="permGranted">
                <label class="block text-sm font-medium text-muted-foreground mb-2">Salida de audio (altavoz)</label>
                <select v-model="selectedOutput" @change="applyAudioDevice('output', selectedOutput)"
                  class="w-full px-3.5 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
                  <option v-for="d in audioOutputs" :key="d.deviceId" :value="d.deviceId">{{ d.label || 'Altavoz ' + d.deviceId.slice(0,8) }}</option>
                </select>
              </div>
              <div v-if="permGranted" class="pt-3">
                <label class="block text-sm font-medium text-muted-foreground mb-2">Entrada de micrófono</label>
                <select v-model="selectedInput" @change="applyAudioDevice('input', selectedInput)"
                  class="w-full px-3.5 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
                  <option v-for="d in audioInputs" :key="d.deviceId" :value="d.deviceId">{{ d.label || 'Micrófono ' + d.deviceId.slice(0,8) }}</option>
                </select>
              </div>
              <div v-if="!permGranted" class="bg-accent/30 rounded-xl p-4">
                <p class="text-xs text-muted-foreground">Haz clic en "Solicitar permisos de audio" para que el navegador permita el acceso al micrófono y altavoces.</p>
              </div>
            </div>

            <!-- TAB: Notificaciones -->
            <div v-if="settingsTab==='notifications'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-muted-foreground mb-2">Sonido al recibir mensaje</label>
                <div class="flex gap-2">
                  <select v-model="notifySound" @change="changeNotifySound"
                    class="flex-1 px-3.5 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors">
                    <option value="/audio/notify_001.mp3">Notificación 1</option>
                    <option value="/audio/notify_002.mp3">Notificación 2</option>
                    <option value="/audio/notify_003.mp3">Notificación 3</option>
                    <option value="none">Sin sonido</option>
                  </select>
                  <button @click="previewNotify" class="px-3 py-2.5 bg-accent border border-input rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/70 transition-colors shrink-0" title="Probar">▶</button>
                </div>
                <p class="text-xs text-muted-foreground mt-1.5">Se reproduce automáticamente al recibir un mensaje de un contacto.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ============ MODAL AGREGAR CONTACTO ============ -->
      <div v-if="showAddContact" class="fixed inset-0 bg-black/60 flex items-end lg:items-center justify-center z-50" @click.self="showAddContact=false">
        <div class="w-full lg:max-w-sm bg-card rounded-t-2xl lg:rounded-xl border border-input p-6 mx-0 lg:mx-4 shadow-2xl max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">Agregar Contacto</h3>
            <button @click="showAddContact=false" class="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
          </div>
          <div class="relative mb-4">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" v-model="contactSearch" placeholder="Buscar usuarios por email..."
              class="w-full pl-9 pr-3 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
          </div>
          <div class="flex-1 overflow-y-auto space-y-1">
            <div v-for="user in searchResults" :key="user.id"
              class="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{{ user.email.charAt(0).toUpperCase() }}</div>
                <div>
                  <p class="text-sm font-medium text-foreground">{{ user.email }}</p>
                  <p class="text-xs text-muted-foreground">{{ user.role }}</p>
                </div>
              </div>
              <button @click="addContact(user)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">Agregar</button>
            </div>
            <div v-if="searchResults.length===0 && contactSearch.length>1" class="text-center py-8 text-muted-foreground text-sm">Sin resultados</div>
            <div v-if="contactSearch.length<2" class="text-center py-8 text-muted-foreground text-sm">Escribe al menos 2 caracteres para buscar</div>
          </div>
        </div>
      </div>

      <!-- ============ MODAL LLAMADA ENTRANTE ============ -->
      <div v-if="incomingCall" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70" @click.self="rejectIncomingCall">
        <div class="w-full max-w-xs bg-card rounded-2xl border border-input p-8 mx-4 shadow-2xl text-center space-y-6">
          <div class="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-3xl font-bold text-green-400 mx-auto ring-4 ring-green-500/30 animate-pulse">
            {{ incomingCall.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-foreground">{{ incomingCall.name }}</h2>
            <p class="text-sm text-muted-foreground mt-1">Llamada entrante</p>
          </div>
          <div class="flex gap-4 justify-center">
            <button @click="acceptIncomingCall" class="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-2xl hover:bg-green-500/30 transition-colors border-2 border-green-500/50" title="Contestar">📞</button>
            <button @click="rejectIncomingCall" class="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center text-2xl hover:bg-destructive/30 transition-colors border-2 border-destructive/50" title="Rechazar">✕</button>
          </div>
          <p class="text-xs text-muted-foreground">Tono de llamada...</p>
        </div>
      </div>

      <!-- ============ MODAL INVITACIÓN ============ -->
      <div v-if="showInvitationModal && pendingInvitation" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70" @click.self="showInvitationModal=false">
        <div class="w-full max-w-xs bg-card rounded-2xl border border-input p-8 mx-4 shadow-2xl text-center space-y-6">
          <div class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mx-auto ring-4 ring-primary/30">
            {{ (pendingInvitation.from_name || '?').charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-foreground">{{ pendingInvitation.from_name || 'Alguien' }}</h2>
            <p class="text-sm text-muted-foreground mt-1">Quiere agregarte como contacto</p>
          </div>
          <div class="flex gap-4 justify-center">
            <button @click="acceptInvite(pendingInvitation)" class="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">Aceptar</button>
            <button @click="rejectInvite(pendingInvitation)" class="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">Rechazar</button>
          </div>
        </div>
      </div>

      <!-- ============ MÓVIL: CANALES + CONTACTOS ============ -->
      <div v-if="section==='contacts' && !chatOpen" class="flex-1 flex flex-col min-w-0 max-w-3xl mx-auto w-full">
        <div class="px-4 py-3 border-b border-input bg-card shrink-0">
          <div class="flex items-center gap-3 mb-3">
            <button @click="section='explore-channels'" class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              Explorar
            </button>
            <button @click="section='create-channel'" class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-input hover:bg-accent/40 hover:text-foreground transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Crear
            </button>
          </div>
          <div v-if="activeChannel" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 cursor-pointer" @click="showChannelProfile(activeChannel)">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
            <span class="text-sm text-foreground flex-1 truncate"># {{ activeChannel.name }}</span>
            <span class="text-xs text-green-400">En sala</span>
          </div>
        </div>
        <div class="px-4 py-3 border-b border-input shrink-0">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">Contactos</h3>
            <div class="flex items-center gap-1">
              <button @click="showAddContact=true" class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" title="Agregar contacto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              </button>
              <span class="text-xs text-muted-foreground">{{ filteredMobileContacts.length }}</span>
            </div>
          </div>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Buscar..." v-model="mobileSearch"
              class="w-full pl-8 pr-3 py-2 text-sm bg-accent/60 border border-input/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-3 py-1">
          <div v-for="contact in filteredMobileContacts" :key="contact.id"
            class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent/40 cursor-pointer transition-colors">
            <button @click.stop="showProfile(contact)" class="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 hover:ring-2 hover:ring-primary/50 transition-all relative">
              {{ contact.name.charAt(0).toUpperCase() }}
              <span v-if="chatStore.unread[contact.id]" class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive"></span>
            </button>
            <p class="text-sm text-foreground truncate flex-1 cursor-pointer" @click="openMobileChat(contact)">{{ contact.name }}</p>
          </div>
          <div v-if="filteredMobileContacts.length===0" class="text-center py-8 text-muted-foreground text-sm">Sin resultados</div>
        </div>
        <!-- Invitaciones pendientes móvil -->
        <div v-if="callStore.pendingInvitations.length > 0" class="px-4 py-3 border-t border-input bg-card">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invitaciones ({{ callStore.pendingInvitations.length }})</p>
          <div v-for="inv in callStore.pendingInvitations" :key="inv.id" class="flex items-center justify-between py-2 border-b border-input last:border-0">
            <span class="text-sm text-foreground">{{ inv.from_name || 'Usuario' }}</span>
            <div class="flex gap-2">
              <button @click="acceptInvite(inv)" class="px-3 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">Aceptar</button>
              <button @click="rejectInvite(inv)" class="px-3 py-1 rounded-md text-xs font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">Rechazar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ MÓVIL: CHAT ABIERTO ============ -->
      <div v-if="section==='contacts' && chatOpen" class="flex-1 flex flex-col min-w-0 min-h-0">
        <!-- Header con botón volver -->
        <div class="flex items-center gap-3 px-3 py-2.5 border-b border-input bg-card shrink-0">
          <button @click="closeMobileChat" class="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div v-if="activeChatData" class="flex items-center gap-2.5 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{{ activeChatData.name.charAt(0).toUpperCase() }}</div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{{ activeChatData.name }}</p>
              <p class="text-xs" :class="activeChatData.online?'text-green-400':'text-muted-foreground'">{{ activeChatData.online ? 'En línea' : 'Desconectado' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button @click.stop="sendBuzz" class="p-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors text-sm">🔔</button>
            <button @click.stop="callFromChat" class="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors text-sm">📞</button>
          </div>
        </div>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-3 space-y-3 messages-scroll">
          <div v-if="currentMessages.length===0" class="text-center py-10 text-muted-foreground text-sm">No hay mensajes aún</div>
          <div v-for="msg in currentMessages" :key="msg.id" class="flex" :class="msg.from==='me'?'justify-end':'justify-start'">
            <div class="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
                  :class="msg.type==='buzz'?'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 italic text-center w-full':msg.from==='me'?'bg-primary text-primary-foreground rounded-br-md':'bg-card border border-input text-foreground rounded-bl-md'">
                  <p>{{ msg.text }}</p>
                  <p v-if="msg.type!=='buzz'" class="text-xs mt-1 opacity-60 text-right">{{ formatTime(msg.time) }}</p>
                </div>
              </div>
            </div>

            <div class="border-t border-input p-2 bg-card shrink-0">
              <form @submit.prevent="sendMessage" class="flex gap-2">
                <button type="button" @click="sendBuzz" class="px-2.5 py-2 rounded-xl bg-accent border border-input text-yellow-400 hover:bg-yellow-500/10 transition-colors shrink-0 text-sm">🔔</button>
                <input type="text" v-model="newMessage" placeholder="Escribe un mensaje..."
                  class="flex-1 px-3.5 py-2 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors min-w-0" />
                <Button type="submit" size="sm" :disabled="!newMessage.trim()">Enviar</Button>
              </form>
          </div>
      </div>

      <!-- ============ PERFIL DE CONTACTO / LLAMADA ============ -->
      <div v-if="section==='profile' && profileContact" class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center gap-2 px-4 py-2.5 border-b border-input bg-card shrink-0">
          <button @click="closeProfile" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Volver
          </button>
        </div>
        <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <!-- Vista durante llamada: dos participantes -->
          <div v-if="isCallingThisProfile" class="w-full max-w-md text-center space-y-8">
            <div class="flex items-center justify-center gap-8">
              <!-- Tú (logueado) -->
              <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mx-auto ring-4 ring-primary/20">
                  {{ (profileNickname || loggedEmail || 'T').charAt(0).toUpperCase() }}
                </div>
                <p class="text-sm font-medium text-foreground mt-3">{{ profileNickname || loggedEmail?.split('@')[0] || 'Tú' }}</p>
                <p class="text-xs text-muted-foreground">Tú</p>
              </div>

              <!-- Indicador de conexión -->
              <div class="flex flex-col items-center gap-1">
                <div v-if="activeCall.status==='active'" class="text-2xl text-green-400">📞</div>
                <div v-else class="text-2xl text-yellow-400 animate-pulse">🔊</div>
                <div class="w-12 h-0.5 bg-border"></div>
                <div class="flex gap-1 mt-1">
                  <div v-for="i in 3" :key="i"
                    class="w-1 h-1 rounded-full transition-all"
                    :class="activeCall.status==='active' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'"
                    :style="{ animationDelay: i * 0.2 + 's' }"></div>
                </div>
              </div>

              <!-- Contacto (el otro) -->
              <div class="text-center">
                <div class="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto ring-4"
                  :class="activeCall.status==='active'?'bg-green-500/20 text-green-400 ring-green-500/50':'bg-yellow-500/20 text-yellow-400 ring-yellow-500/50'">
                  {{ profileContact.name.charAt(0).toUpperCase() }}
                </div>
                <p class="text-sm font-medium text-foreground mt-3">{{ profileContact.name }}</p>
                <p class="text-xs text-muted-foreground">{{ activeCall.status === 'calling' ? 'Llamando...' : activeCall.status === 'ringing' ? 'Sonando...' : 'En llamada' }}</p>
              </div>
            </div>

            <!-- Estado y duración -->
            <div>
              <p class="text-sm" :class="activeCall.status==='active'?'text-green-400':'text-yellow-400'">
                <span class="w-2 h-2 rounded-full inline-block mr-2 animate-pulse" :class="activeCall.status==='active'?'bg-green-500':'bg-yellow-500'"></span>
                {{ activeCall.status === 'calling' ? 'Llamando...' : activeCall.status === 'ringing' ? 'Sonando...' : 'En llamada' }}
              </p>
              <p v-if="activeCall.status==='active'" class="text-xs text-muted-foreground mt-1 font-mono">{{ formatDuration(activeCallDuration) }}</p>
            </div>

            <!-- Controles -->
            <div class="flex gap-4 justify-center">
              <button @click="toggleMute" class="w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors" :class="muted ? 'bg-destructive/20 text-destructive' : 'bg-accent/50 text-muted-foreground hover:text-foreground'" :title="muted ? 'Activar micrófono' : 'Silenciar'">
                {{ muted ? '🔇' : '🎤' }}
              </button>
              <button @click="endActiveCall" class="w-14 h-14 rounded-full flex items-center justify-center text-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors" title="Colgar">
                ✕
              </button>
            </div>
          </div>

          <!-- Vista normal (sin llamada) -->
          <div v-else class="w-full max-w-sm text-center space-y-6">
            <div class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mx-auto ring-4 ring-primary/20">
              {{ profileContact.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-xl font-bold text-foreground">{{ profileContact.name }}</h2>
              <p class="text-sm text-muted-foreground mt-0.5">{{ profileContact.email || 'Sin correo' }}</p>
            </div>
            <div class="bg-card rounded-xl border border-input p-4 text-left">
              <p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Descripción</p>
              <p class="text-sm text-foreground">{{ profileContact.description || 'Sin descripción' }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <button @click="callContact(profileContact)" class="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground border border-input hover:text-foreground hover:border-muted-foreground transition-colors">Llamar</button>
              <button v-if="isProfileContact" @click="removeProfileContact" class="flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">Eliminar contacto</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ PERFIL DE CANAL ============ -->
      <div v-if="section==='channel' && selectedChannel" class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center gap-2 px-4 py-2.5 border-b border-input bg-card shrink-0">
          <button @click="closeChannelProfile" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Volver
          </button>
        </div>
        <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div class="w-full max-w-sm text-center space-y-6">
            <div class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto ring-4" :class="selectedChannel.active ? 'ring-green-500/50' : 'ring-primary/20'">
              <svg class="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v3m0 0H8m4 0h4m-4-7a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-foreground"># {{ selectedChannel.name }}</h2>
              <p class="text-sm text-muted-foreground mt-1">{{ selectedChannel.description }}</p>
            </div>
            <div class="bg-card rounded-xl border border-input p-4 text-left">
              <p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Miembros en sala ({{ selectedChannel.members.length }})</p>
              <div class="space-y-2">
                <div v-for="member in selectedChannel.members" :key="member" class="flex items-center gap-2.5">
                  <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                  <span class="text-sm text-foreground">{{ member }}</span>
                </div>
              </div>
            </div>
            <button v-if="!selectedChannel.active" @click="joinChannel" class="w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">Unirse al canal</button>
            <button v-else @click="leaveChannel" class="w-full py-2.5 rounded-xl text-sm font-medium text-destructive border border-destructive/50 hover:bg-destructive/10 transition-colors">Abandonar canal</button>
          </div>
        </div>
      </div>

      <!-- ============ EXPLORAR CANALES ============ -->
      <div v-if="section==='explore-channels'" class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-input bg-card shrink-0">
          <h2 class="text-sm font-semibold text-foreground">Explorar Canales</h2>
          <button @click="closeExplore" class="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-lg">✕</button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 lg:p-6">
          <div class="max-w-xl mx-auto space-y-3">
            <div class="relative mb-4">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" v-model="channelSearch" placeholder="Buscar canales por nombre..."
                class="w-full pl-9 pr-3 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
            </div>
            <div v-if="filteredChannels.length===0" class="text-center py-10 text-muted-foreground text-sm">No se encontraron canales</div>
            <div v-for="channel in filteredChannels" :key="channel.id"
              @click="showChannelProfile(channel)"
              class="bg-card border border-input rounded-xl p-4 cursor-pointer hover:bg-accent/20 transition-colors"
              :class="channel.active ? 'ring-1 ring-green-500/30' : ''">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v3m0 0H8m4 0h4m-4-7a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-semibold text-foreground"># {{ channel.name }}</h3>
                    <span v-if="channel.active" class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-0.5 line-clamp-1">{{ channel.description }}</p>
                </div>
                <span class="text-xs text-muted-foreground shrink-0">{{ channel.members.length }} miembros</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ CREAR CANAL ============ -->
      <div v-if="section==='create-channel'" class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-input bg-card shrink-0">
          <h2 class="text-sm font-semibold text-foreground">Crear Canal</h2>
          <button @click="closeExplore" class="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-lg">✕</button>
        </div>
        <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div class="w-full max-w-sm space-y-5">
            <div class="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </div>
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-1.5">Nombre del canal</label>
              <input type="text" v-model="newChannelName" placeholder="Ej: Música, Juegos, Estudio..."
                class="w-full px-3.5 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-medium text-muted-foreground mb-1.5">Descripción</label>
              <textarea rows="3" v-model="newChannelDesc" placeholder="Describe de qué trata el canal..."
                class="w-full px-3.5 py-2.5 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"></textarea>
            </div>
            <button @click="createChannel" :disabled="!newChannelName.trim()"
              class="w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50">Crear Canal</button>
            <p v-if="channelCreated" class="text-xs text-green-400 text-center">Canal creado correctamente</p>
          </div>
        </div>
      </div>

      <!-- ============ ESCRITORIO: vista inicial ============ -->
      <div v-if="section==='desktop'" class="flex-1 flex items-center justify-center">
        <div class="text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <h2 class="text-xl font-semibold text-foreground">Bienvenido a Vozz</h2>
          <p class="text-sm text-muted-foreground max-w-xs">Explora los canales de voz disponibles desde la lista de la derecha.</p>
        </div>
      </div>

      <!-- ============ ESCRITORIO: sección Chats ============ -->
      <div v-if="section==='chats'" class="flex-1 flex flex-col min-w-0 min-h-0">
        <div v-if="openChats.length===0" class="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
          <div><svg class="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg><p>Toca un contacto para iniciar un chat</p></div>
        </div>
        <div v-else class="flex-1 flex flex-col min-w-0 min-h-0">
          <div class="flex items-center border-b border-input bg-card overflow-x-auto shrink-0">
            <div v-for="chat in openChats" :key="chat.id"
              class="flex items-center gap-2 px-3 lg:px-4 py-2.5 text-sm font-medium cursor-pointer border-b-2 transition-colors shrink-0"
              :class="chatStore.activeChatId===chat.id?'border-primary text-foreground bg-accent/20':'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/10'"
              @click="chatStore.setActiveChat(chat.id)">
              <span class="w-2 h-2 rounded-full shrink-0" :class="chat.online?'bg-green-500':'bg-muted-foreground'"></span>
              <span class="truncate max-w-20 lg:max-w-28">{{ chat.name }}</span>
              <span v-if="chat.unread>0 && chatStore.activeChatId!==chat.id" class="bg-destructive text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">{{ chat.unread }}</span>
              <button @click.stop="chatStore.closeChat(chat.id)" class="text-muted-foreground hover:text-foreground ml-0.5 leading-none shrink-0">&times;</button>
            </div>
          </div>
          <div class="flex-1 flex flex-col min-w-0 min-h-0" :class="{'animate-shake': chatStore.isBuzzing(chatStore.activeChatId)}">
            <div v-if="activeChatData" class="flex items-center justify-between px-3 lg:px-6 py-2.5 border-b border-input bg-card shrink-0">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{{ activeChatData.name.charAt(0).toUpperCase() }}</div>
                <div class="min-w-0"><p class="text-sm font-medium text-foreground truncate">{{ activeChatData.name }}</p><p class="text-xs" :class="activeChatData.online?'text-green-400':'text-muted-foreground'">{{ activeChatData.online ? 'En línea' : 'Desconectado' }}</p></div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button @click.stop="sendBuzz" class="p-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors text-sm">🔔</button>
                <button @click.stop="callFromChat" class="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors text-sm">📞</button>
              </div>
            </div>
            <div ref="messagesContainer" class="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 messages-scroll">
              <div v-for="msg in currentMessages" :key="msg.id" class="flex" :class="msg.from==='me'?'justify-end':'justify-start'">
                <div class="max-w-[80%] lg:max-w-md px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
                   :class="msg.type==='buzz'?'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 italic text-center w-full':msg.from==='me'?'bg-primary text-primary-foreground rounded-br-md':'bg-card border border-input text-foreground rounded-bl-md'">
                  <p>{{ msg.text }}</p><p v-if="msg.type!=='buzz'" class="text-xs mt-1 opacity-60 text-right">{{ formatTime(msg.time) }}</p>
                </div>
              </div>
            </div>
            <div class="border-t border-input p-2 lg:p-4 bg-card shrink-0">
              <form @submit.prevent="sendMessage" class="flex gap-2">
                <button type="button" @click="sendBuzz" class="px-2.5 py-2 rounded-xl bg-accent border border-input text-yellow-400 hover:bg-yellow-500/10 transition-colors shrink-0 text-sm">🔔</button>
                <input type="text" v-model="newMessage" placeholder="Escribe un mensaje..."
                  class="flex-1 px-3.5 py-2 bg-accent border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors min-w-0" />
                <Button type="submit" size="sm" :disabled="!newMessage.trim()">Enviar</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ============ SIDEBAR DERECHA (solo escritorio) ============ -->
    <aside class="hidden lg:flex w-72 shrink-0 bg-card border-l border-input flex-col h-screen sticky top-0 z-50">
      <div class="px-4 py-4 border-b border-input">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
              <div class="relative">
              <button @click="menuOpen=!menuOpen" class="w-7 h-7 rounded-lg bg-card border border-input flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" title="Menú">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
              <Transition name="fade">
                <div v-if="menuOpen" class="absolute top-9 left-0 w-48 bg-card border border-input rounded-xl shadow-2xl py-2 overflow-hidden z-50" @click.stop>
                  <div class="px-4 py-2 border-b border-input mb-1"><p class="text-xs font-bold text-foreground">Vozz</p></div>
                  <button @click="section=window.innerWidth >= 1024 ? 'desktop' : 'chats'; menuOpen=false" class="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors" :class="section==='desktop'||section==='chats'?'bg-primary/10 text-primary':'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> Inicio
                    <span v-if="totalUnread>0" class="ml-auto bg-destructive text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">{{ totalUnread }}</span>
                  </button>
                  <button @click="showHistoryModal=true; menuOpen=false" class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Historial
                  </button>
                  <button @click="openSettings" class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Config
                  </button>
                  <button @click="installApp; menuOpen=false" class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Instalar app
                  </button>
                  <div class="border-t border-input mt-1 pt-1">
                    <button @click.prevent="handleLogout" class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
            <h3 class="text-sm font-semibold text-foreground">Canales</h3>
          </div>
        </div>
        <!-- Canales de voz -->
        <div class="px-3 py-2 space-y-0.5">
          <button @click="section='explore-channels'" class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm text-primary hover:bg-primary/10 w-full">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Explorar canales
          </button>
          <button @click="section='create-channel'" class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground w-full">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Crear canal
          </button>
        </div>

        <!-- Lista rápida: canales activos -->
        <div class="px-3 pb-2">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activos</h4>
          </div>
          <div class="space-y-0.5">
            <div v-for="channel in callStore.channels.filter(c => c.active)" :key="channel.id"
              @click="showChannelProfile(channel)"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/40 cursor-pointer transition-colors">
              <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span class="text-xs text-foreground truncate">{{ channel.name }}</span>
            </div>
            <div v-if="callStore.channels.filter(c => c.active).length === 0" class="text-xs text-muted-foreground py-1 px-2">Ningún canal activo</div>
          </div>
        </div>

        <!-- Separador -->
        <div class="border-t border-input my-2 mx-3"></div>

        <!-- Contactos slim -->
        <div class="px-3 pb-2">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contactos</h4>
            <div class="flex items-center gap-1">
              <button @click="showAddContact=true" class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" title="Agregar contacto">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              </button>
              <span class="text-xs text-muted-foreground">{{ contacts.length }}</span>
            </div>
          </div>
          <div class="relative mb-2">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Buscar..." v-model="search"
              class="w-full pl-8 pr-2.5 py-1.5 text-xs bg-accent/60 border border-input/50 rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
          </div>
           <div class="space-y-0.5">
             <div v-if="callStore.contacts.length === 0" class="text-xs text-muted-foreground px-2 py-1">Sin contactos agregados</div>
             <div v-for="contact in callStore.contacts" :key="contact.id"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/40 cursor-pointer transition-colors group">
              <button @click.stop="showProfile(contact)" class="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 hover:ring-2 hover:ring-primary/50 transition-all relative">
                {{ contact.name.charAt(0).toUpperCase() }}
                <span v-if="chatStore.unread[contact.id]" class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive"></span>
              </button>
              <p class="text-xs text-foreground truncate flex-1 cursor-pointer" @click="openChatWithContact(contact)">{{ contact.name }}</p>
            </div>
            </div>
          </div>
        </div>
        <!-- Invitaciones pendientes escritorio -->
        <div v-if="callStore.pendingInvitations.length > 0" class="px-3 pb-2 mt-2">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invitaciones ({{ callStore.pendingInvitations.length }})</h4>
          </div>
          <div v-for="inv in callStore.pendingInvitations" :key="inv.id" class="flex items-center justify-between py-1.5">
            <span class="text-xs text-foreground truncate">{{ inv.from_name || 'Usuario' }}</span>
            <div class="flex gap-1 shrink-0">
              <button @click="acceptInvite(inv)" class="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">✓</button>
              <button @click="rejectInvite(inv)" class="px-2 py-0.5 rounded text-[10px] font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">✕</button>
            </div>
          </div>
        </div>
      </aside>

    <!-- ============ BARRA INFERIOR MÓVIL ============ -->
    <nav class="fixed bottom-0 inset-x-0 lg:hidden bg-card border-t border-input flex items-center justify-around px-2 py-2 z-30 safe-area-bottom shadow-2xl">
      <button @click="section='contacts'; chatOpen=false" class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-16" :class="section==='contacts'?'text-primary':'text-muted-foreground hover:text-foreground'">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20l5-5-5-5M12 8v8m0 0l5-5-5-5"/></svg>
        <span class="text-[11px] font-medium leading-tight">Contactos</span>
      </button>
      <button @click="showNewCallModal=true" class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground min-w-16">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        <span class="text-[11px] font-medium leading-tight">Llamar</span>
      </button>
      <button @click="showHistoryModal=true" class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground min-w-16">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span class="text-[11px] font-medium leading-tight">Historial</span>
      </button>
      <button @click="openSettings" class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground min-w-16">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        <span class="text-[11px] font-medium leading-tight">Config</span>
      </button>
    </nav>

    <!-- Overlay transparente para cerrar menú al hacer clic fuera -->
    <div v-if="menuOpen" class="fixed inset-0 z-40 bg-transparent" @click="menuOpen=false"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCallStore } from '../stores/calls'
import { useChatStore } from '../stores/chat'
import { format } from 'date-fns'
import Button from '../components/ui/Button.vue'

const authStore = useAuthStore()
const callStore = useCallStore()
const chatStore = useChatStore()
const router = useRouter()

const user = ref(authStore.user || {})
const search = ref('')
const mobileSearch = ref('')
const section = ref(window.innerWidth >= 1024 ? 'desktop' : 'contacts')
const chatOpen = ref(false)
const menuOpen = ref(false)
const globalBuzz = ref(false)
const newMessage = ref('')
const messagesContainer = ref(null)

const todayCalls = ref(0)
const totalMinutes = ref(0)
const contactsCount = ref(0)
const recentCalls = ref([])

const activeCall = ref(null)
const activeCallDuration = ref(0)
let callTimerInterval = null
const muted = ref(false)
const callVolume = ref(80)

const toggleMute = () => {
  muted.value = !muted.value
  if (muted.value) activeCall.value = { ...activeCall.value, speaking: false }
}

const setCallVolume = () => {
  localStorage.setItem('vozz_call_volume', String(callVolume.value))
}

// Simular indicador de habla mientras la llamada está activa
let speakInterval = null
const startSpeakingSim = () => {
  if (speakInterval) clearInterval(speakInterval)
  speakInterval = setInterval(() => {
    if (activeCall.value && activeCall.value.status === 'active' && !muted.value) {
      activeCall.value = { ...activeCall.value, speaking: Math.random() > 0.5 }
    }
  }, 1000)
}
const stopSpeakingSim = () => { if (speakInterval) { clearInterval(speakInterval); speakInterval = null } }
let unsubscribeIncoming = null
let invitePoll = null

const showNewCallModal = ref(false)
const showHistoryModal = ref(false)
const showSettingsModal = ref(false)
const showAddContact = ref(false)
const contactSearch = ref('')
const incomingCall = ref(null)
const showInvitationModal = ref(false)
const pendingInvitation = ref(null)
const channelSearch = ref('')
const newChannelName = ref('')
const newChannelDesc = ref('')
const channelCreated = ref(false)
const permLoading = ref(false)
const permGranted = ref(false)
const audioInputs = ref([])
const audioOutputs = ref([])
const selectedInput = ref('')
const selectedOutput = ref('')
const settingsTab = ref('profile')

const activeChatData = computed(() => {
  const chat = chatStore.openChats.find(c => c.id === chatStore.activeChatId)
  if (!chat) return null
  const contact = callStore.contacts.find(c => c.id === chat.id)
  return { ...chat, online: contact ? contact.online : false }
})

const onlineContacts = computed(() => callStore.onlineContacts)
const offlineContacts = computed(() => callStore.offlineContacts)
const filteredContacts = computed(() => callStore.contacts.filter(c => c.name.toLowerCase().includes(search.value.toLowerCase())))
const contacts = computed(() => callStore.contacts)
const filteredMobileContacts = computed(() => callStore.contacts.filter(c => c.name.toLowerCase().includes(mobileSearch.value.toLowerCase())))
const openChats = computed(() => chatStore.openChats)
const currentMessages = computed(() => chatStore.activeChatId ? chatStore.getMessages(chatStore.activeChatId) : [])
const totalUnread = computed(() => chatStore.totalUnread)
const showInstall = computed(() => window.__installPrompt ? true : false)

const openSettings = () => {
  settingsTab.value = 'profile'
  showSettingsModal.value = true
}
const loggedEmail = computed(() => authStore.user?.email || user.value?.email || localStorage.getItem('vozz_login_email') || 'test@gmail.com')
const loggedName = computed(() => authStore.user?.name || user.value?.name || loggedEmail.value.split('@')[0])
const activeChannel = computed(() => callStore.activeChannel)
const searchResults = computed(() =>
  callStore.allUsers.filter(c =>
    c.email.toLowerCase().includes(contactSearch.value.toLowerCase()) &&
    !callStore.contacts.find(co => co.email === c.email)
  )
)
const filteredChannels = computed(() =>
  callStore.channels.filter(c => c.name.toLowerCase().includes(channelSearch.value.toLowerCase()))
)
const profileContact = ref(null)
const selectedChannel = ref(null)
const selectedChannelPrev = ref(null)
const isCallingThisProfile = computed(() => activeCall.value && profileContact.value && activeCall.value.name === profileContact.value.name)
const isProfileContact = computed(() => profileContact.value && callStore.contacts.some(c => c.id === profileContact.value.id))

// Perfil
const profileNickname = ref(localStorage.getItem('vozz_nickname') || '')
const profileDescription = ref(localStorage.getItem('vozz_description') || '')
const profileSaved = ref(false)

const saveProfile = () => {
  localStorage.setItem('vozz_nickname', profileNickname.value)
  localStorage.setItem('vozz_description', profileDescription.value)
  profileSaved.value = true
  setTimeout(() => { profileSaved.value = false }, 2000)
}

// Apariencia
const currentTheme = ref(localStorage.getItem('vozz_theme') || 'dark')

const setTheme = (theme) => {
  currentTheme.value = theme
  localStorage.setItem('vozz_theme', theme)
  document.documentElement.className = theme === 'dark' ? '' : `theme-${theme}`
}

// Aplicar tema al montar
const savedTheme = localStorage.getItem('vozz_theme')
if (savedTheme && savedTheme !== 'dark') {
  document.documentElement.className = `theme-${savedTheme}`
}

// Notificaciones
const notifySound = ref(localStorage.getItem('vozz_notify_sound') || '/audio/notify_001.mp3')

const requestAudioPermissions = async () => {
  permLoading.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(t => t.stop())
    permGranted.value = true
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioInputs.value = devices.filter(d => d.kind === 'audioinput')
    audioOutputs.value = devices.filter(d => d.kind === 'audiooutput')
    const savedInput = localStorage.getItem('vozz_audio_input')
    const savedOutput = localStorage.getItem('vozz_audio_output')
    selectedInput.value = savedInput && audioInputs.value.find(d => d.deviceId === savedInput) ? savedInput : (audioInputs.value[0]?.deviceId || '')
    selectedOutput.value = savedOutput && audioOutputs.value.find(d => d.deviceId === savedOutput) ? savedOutput : (audioOutputs.value[0]?.deviceId || '')
  } catch (e) {
    permGranted.value = false
    console.warn('Permiso de audio denegado:', e)
  } finally {
    permLoading.value = false
  }
}

const applyAudioDevice = (type, deviceId) => {
  if (type === 'output' && deviceId) {
    localStorage.setItem('vozz_audio_output', deviceId)
    import('../services/webrtc.js').then(w => w.applyOutputDevice(deviceId))
  }
  if (type === 'input' && deviceId) {
    localStorage.setItem('vozz_audio_input', deviceId)
  }
}

const changeNotifySound = async () => {
  const { setNotifySrc } = await import('../utils/notify.js')
  setNotifySrc(notifySound.value)
}

const previewNotify = () => {
  const audio = new Audio(notifySound.value === 'none' ? undefined : notifySound.value)
  if (notifySound.value !== 'none') {
    audio.volume = 0.5
    audio.play().catch(() => {})
  }
}

const formatDate = (d) => { if (!d) return ''; try { return format(new Date(d), 'HH:mm') } catch { return '' } }
const formatTime = (d) => { if (!d) return ''; try { return format(new Date(d), 'HH:mm') } catch { return '' } }
const formatDuration = (sec) => { if (sec===null||sec===undefined) return ''; return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}` }
const statusLabel = (s) => { const m={initiated:'Iniciada',active:'Activa',ringing:'Sonando',ended:'Finalizada'}; return m[s]||s }

const handleLogout = async () => {
  menuOpen.value = false
  await authStore.logout()
  // Forzar recarga completa de la página desde el servidor
  window.location.replace('/login?t=' + Date.now())
}

const showProfile = (contact) => {
  profileContact.value = contact
  section.value = 'profile'
}

const closeProfile = () => {
  profileContact.value = null
  section.value = window.innerWidth >= 1024 ? 'desktop' : 'contacts'
}

const showChannelProfile = (channel) => {
  selectedChannel.value = channel
  selectedChannelPrev.value = section.value
  section.value = 'channel'
}

const closeChannelProfile = () => {
  selectedChannel.value = null
  section.value = selectedChannelPrev.value || (window.innerWidth >= 1024 ? 'desktop' : 'contacts')
}

const closeExplore = () => {
  section.value = window.innerWidth >= 1024 ? 'desktop' : 'contacts'
}

const getUserName = () => profileNickname.value || user.value?.email || 'Usuario'

const joinChannel = () => {
  if (!selectedChannel.value) return
  callStore.toggleChannel(selectedChannel.value.id, getUserName())
  closeChannelProfile()
}

const leaveChannel = () => {
  if (!selectedChannel.value) return
  callStore.toggleChannel(selectedChannel.value.id, getUserName())
  closeChannelProfile()
}

const createChannel = () => {
  if (!newChannelName.value.trim()) return
  callStore.createChannel(newChannelName.value.trim(), newChannelDesc.value.trim())
  channelCreated.value = true
  newChannelName.value = ''
  newChannelDesc.value = ''
  setTimeout(() => {
    channelCreated.value = false
    section.value = window.innerWidth >= 1024 ? 'desktop' : 'contacts'
  }, 1500)
}

const openChatWithContact = (contact) => {
  chatStore.openChat(contact)
  const uid = authStore.user?.id
  if (uid) chatStore.loadConversation(uid, contact.id).then(() => nextTick(scrollToBottom))
  section.value = window.innerWidth >= 1024 ? 'chats' : 'contacts'
  if (window.innerWidth < 1024) chatOpen.value = true
}

const openMobileChat = (contact) => {
  chatStore.openChat(contact)
  const uid = authStore.user?.id
  if (uid) chatStore.loadConversation(uid, contact.id).then(() => nextTick(scrollToBottom))
  chatOpen.value = true
}

const closeMobileChat = () => {
  chatOpen.value = false
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !chatStore.activeChatId) return
  chatStore.sendMessage(chatStore.activeChatId, newMessage.value.trim())
  newMessage.value = ''
}

const sendBuzz = () => {
  if (!chatStore.activeChatId) return
  chatStore.sendBuzz(chatStore.activeChatId)
  globalBuzz.value = true
  setTimeout(() => { globalBuzz.value = false }, 800)
  nextTick(scrollToBottom)
}

const scrollToBottom = () => {
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

const callFromChat = () => {
  const contact = callStore.contacts.find(c => c.id === chatStore.activeChatId)
  if (contact) {
    profileContact.value = contact
    callContact(contact)
    section.value = 'profile'
  }
}

const callContact = (target) => {
  // No permitir llamada si ya hay una activa
  if (activeCall.value) { console.warn('[CALL] Ya hay una llamada activa'); return }
  const name = target.name || target.callerName || 'Contacto'
  const receiverId = target.id || target.receiverId
  activeCall.value = { id: Date.now(), name, receiverId, status: 'calling' }
  activeCallDuration.value = 0
  if (callTimerInterval) clearInterval(callTimerInterval)
  import('../utils/notify.js').then(m => m.playRing())

  // Enviar llamada via WebSocket
  import('../services/ws.js').then(ws => {
    ws.sendWS('call:initiate', receiverId, { from_name: authStore.user?.name || authStore.user?.email?.split('@')[0] || name, call_type: 'voice' })
  })

  setTimeout(() => {
    if (activeCall.value && activeCall.value.status === 'calling') {
      activeCall.value.status = 'ringing'
    }
  }, 2000)
}

const acceptIncomingCall = () => {
  // No permitir si ya hay llamada activa
  if (activeCall.value) { console.warn('[CALL] Ya hay una llamada activa'); return }
  const caller = incomingCall.value
  incomingCall.value = null
  import('../utils/notify.js').then(m => m.playConnect())
  import('../services/ws.js').then(ws => ws.sendWS('call:answer', caller?.id))

  // Crear llamada activa para el receptor y mostrar vista de llamada
  const name = caller?.name || 'Contacto'
  activeCall.value = { id: Date.now(), name, callerId: caller?.id, status: 'active' }
  activeCallDuration.value = 0
  if (callTimerInterval) clearInterval(callTimerInterval)
  callTimerInterval = setInterval(() => { activeCallDuration.value++ }, 1000)

  // Mostrar perfil del llamante con la vista de llamada
  const callerName = caller?.name || 'Contacto'
  const found = callStore.contacts.find(c => c.id === caller?.id)
  if (found) {
    profileContact.value = found
  } else {
    profileContact.value = { id: caller?.id || 0, name: callerName, email: '', description: '' }
  }
  section.value = 'profile'
  import('../utils/notify.js').then(m => { m.stopIncoming(); m.playConnect() })
}

const rejectIncomingCall = () => {
  const fromId = incomingCall.value?.id
  incomingCall.value = null
  import('../utils/notify.js').then(m => m.stopAll())
  import('../services/ws.js').then(ws => ws.sendWS('call:reject', fromId))
  if (callTimerInterval) clearInterval(callTimerInterval); callTimerInterval = null
  activeCall.value = null
  activeCallDuration.value = 0
}

const endActiveCall = () => {
  try {
    if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null }
    const otherId = activeCall.value?.receiverId || activeCall.value?.callerId
    incomingCall.value = null
    import('../utils/notify.js').then(m => m.stopAll())
    if (otherId) import('../services/ws.js').then(ws => ws.sendWS('call:end', otherId))
    import('../services/webrtc.js').then(w => w.hangup())
    if (activeCall.value) {
      recentCalls.value.unshift({ id: Date.now(), callerName: activeCall.value.name, callType:'voice', status:'ended', createdAt: new Date().toISOString(), duration: activeCallDuration.value })
    }
    stopSpeakingSim()
  } catch (e) { console.error('[CALL] Error ending call:', e) }
  activeCall.value = null; activeCallDuration.value = 0
}

const removeProfileContact = async () => {
  try {
    const uid = authStore.user?.id
    const targetId = profileContact.value?.id
    if (uid && targetId) {
      await callStore.removeContact(uid, targetId)
      closeProfile()
    }
  } catch (e) { console.error('[CONTACTS] Remove error:', e) }
}

const addContact = async (user) => {
  try {
    const uid = authStore.user?.id
    const name = authStore.user?.name || authStore.user?.email?.split('@')[0] || ''
    if (uid) await callStore.sendInvite(uid, user.id, name)
  } catch (e) {
    console.warn('[CONTACTS] Invite error:', e)
  }
  showAddContact.value = false
  contactSearch.value = ''
}

const acceptInvite = async (inv) => {
  try {
    const uid = authStore.user?.id
    if (uid) await callStore.acceptInvite(uid, inv.from_id, inv.from_name)
    showInvitationModal.value = false
    pendingInvitation.value = null
  } catch (e) { console.error('[INVITE] Error accepting:', e) }
}

const rejectInvite = async (inv) => {
  try {
    const uid = authStore.user?.id
    if (uid) await callStore.rejectInvite(uid, inv.from_id)
    showInvitationModal.value = false
    pendingInvitation.value = null
  } catch (e) { console.error('[INVITE] Error rejecting:', e) }
}

const installApp = () => {
  if (window.__installPrompt) {
    window.__installPrompt.prompt()
    window.__installPrompt.userChoice.then(() => { window.__installPrompt = null })
  } else {
    alert('Ve al menú ⋮ de Chrome → Instalar Vozz')
  }
}

watch(() => chatStore.activeChatId, () => nextTick(scrollToBottom))
watch(() => chatStore.activeChatId ? chatStore.conversations[chatStore.activeChatId]?.length : 0, () => nextTick(scrollToBottom))

onMounted(async () => {
  try {
    const { initNotify } = await import('../utils/notify.js')
    initNotify()
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    await authStore.fetchUser(); user.value = authStore.user
    if (authStore.user?.email) {
      localStorage.setItem('vozz_login_email', authStore.user.email)
    }
    await callStore.fetchAllUsers()
    // Cargar contactos e invitaciones del usuario
    if (authStore.user?.id) {
      await callStore.fetchContacts(authStore.user.id)
      await callStore.fetchInvitations(authStore.user.id)
    }
    const stats = await callStore.getStats()
    todayCalls.value = stats.todayCalls; totalMinutes.value = stats.totalMinutes
    contactsCount.value = stats.contactsCount; recentCalls.value = await callStore.getRecentCalls()

    // WebSocket para llamadas en tiempo real
    if (authStore.user?.id) {
      const { connectWS, onWS } = await import('../services/ws.js')
      connectWS(authStore.user.id)

      unsubscribeIncoming = onWS('call:initiate', (msg) => {
        incomingCall.value = { name: msg.from_name || 'Alguien', id: msg.from_id }
        import('../utils/notify.js').then(m => m.playIncoming())
        // Notificación de escritorio
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Llamada entrante', { body: `${msg.from_name || 'Alguien'} te está llamando`, icon: '/icons/icon-192.svg' })
        }
      })

      onWS('call:answer', () => {
        import('../utils/notify.js').then(m => { m.stopRing(); m.playConnect() })
        if (activeCall.value) {
          activeCall.value.status = 'active'
          callTimerInterval = setInterval(() => { activeCallDuration.value++ }, 1000)
          // Iniciar WebRTC como caller
          import('../services/webrtc.js').then(w => w.createOffer(activeCall.value.receiverId))
        }
      })

      onWS('call:reject', () => {
        import('../utils/notify.js').then(m => m.stopAll())
        if (callTimerInterval) clearInterval(callTimerInterval); callTimerInterval = null
        activeCall.value = null; activeCallDuration.value = 0
      })

      onWS('call:end', () => {
        import('../utils/notify.js').then(m => m.stopAll())
        import('../services/webrtc.js').then(w => w.hangup())
        if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null }
        incomingCall.value = null
        stopSpeakingSim()
        activeCall.value = null; activeCallDuration.value = 0
      })

      // WebRTC signaling
      onWS('webrtc:offer', async (msg) => {
        try {
          const w = await import('../services/webrtc.js')
          await w.createAnswer(msg.from_id, msg.sdp)
        } catch (e) { console.error('[WS] webrtc:offer error:', e) }
      })

      onWS('webrtc:answer', async (msg) => {
        try {
          const w = await import('../services/webrtc.js')
          await w.handleAnswer(msg.sdp)
        } catch (e) { console.error('[WS] webrtc:answer error:', e) }
      })

      onWS('webrtc:ice', async (msg) => {
        try {
          const w = await import('../services/webrtc.js')
          await w.handleIce(msg.candidate)
        } catch (e) { console.error('[WS] webrtc:ice error:', e) }
      })

      // Invitaciones de contacto
      onWS('contact:invite', async (msg) => {
        const uid = authStore.user?.id
        if (uid) await callStore.fetchInvitations(uid)
        pendingInvitation.value = { from_id: msg.from_id, from_name: msg.from_name || 'Alguien' }
        showInvitationModal.value = true
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Solicitud de contacto', { body: `${msg.from_name || 'Alguien'} quiere agregarte como contacto`, icon: '/icons/icon-192.svg' })
        }
      })

      onWS('contact:accepted', async (msg) => {
        const uid = authStore.user?.id
        if (!uid) return
        const fromName = msg.payload?.replace(' aceptó tu solicitud de contacto', '') || 'Contacto'
        if (!callStore.contacts.find(c => c.name === fromName || c.id === msg.to_id)) {
          const contact = { id: msg.to_id || Date.now(), name: fromName, email: '', description: '' }
          callStore.contacts.push(contact)
          localStorage.setItem('vozz_contacts', JSON.stringify(callStore.contacts))
        }
      })

      onWS('contact:rejected', () => {
        // Notificar al usuario que su invitación fue rechazada
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Invitación rechazada', { body: 'Tu solicitud de contacto fue rechazada', icon: '/icons/icon-192.svg' })
        }
      })

      onWS('contact:removed', (msg) => {
        const uid = authStore.user?.id
        if (!uid) return
        callStore.contacts = callStore.contacts.filter(c => c.id !== msg.from_id)
        localStorage.setItem('vozz_contacts', JSON.stringify(callStore.contacts))
      })

      onWS('message:new', (msg) => {
        const uid = authStore.user?.id
        if (!uid || msg.from_id === uid) return
        chatStore.receiveMessage(uid, msg.from_id, msg.payload)
      })

      onWS('buzz', (msg) => {
        const uid = authStore.user?.id
        if (!uid || msg.from_id === uid) return
        chatStore.receiveBuzz(msg.from_id)
        globalBuzz.value = true
        setTimeout(() => { globalBuzz.value = false }, 800)
        if (!chatStore.isChatOpen(msg.from_id)) {
          const contact = callStore.contacts.find(c => c.id === msg.from_id)
          if (contact) {
            chatStore.openChat(contact)
          } else {
            chatStore.openChat({ id: msg.from_id, name: msg.from_name || 'Contacto' })
          }
        }
        chatStore.unread[msg.from_id] = 0
        if (window.innerWidth >= 1024) section.value = 'chats'
        else chatOpen.value = true
      })

      // Polling de invitaciones y contactos cada 5s como respaldo
      invitePoll = setInterval(async () => {
        const uid = authStore.user?.id
        if (uid) {
          await callStore.fetchInvitations(uid)
          await callStore.fetchContacts(uid)
        }
      }, 5000)
    }
  } catch {}
})

onUnmounted(() => {
  if (unsubscribeIncoming) unsubscribeIncoming()
  if (invitePoll) clearInterval(invitePoll)
  import('../services/ws.js').then(m => m.disconnectWS())
  if (callTimerInterval) clearInterval(callTimerInterval)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0.5rem); }
@media (max-width: 1023px) { .pb-16 { padding-bottom: 4.5rem; } }
@media (min-width: 1024px) { .pb-16 { padding-bottom: 0; } }

/* Scrollbar visible para el historial de mensajes */
.messages-scroll::-webkit-scrollbar { width: 6px; }
.messages-scroll::-webkit-scrollbar-track { background: transparent; }
.messages-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
.messages-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
.messages-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
</style>