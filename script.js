const acquireLockBtn = document.getElementById('acquire-lock-btn');
const acquireAutoreleaseLockBtn = document.getElementById('acquire-autorelease-lock-btn');
const releaseLockBtn = document.getElementById('release-lock-btn');
const abortLockBtn = document.getElementById('abort-lock-btn');
const abortLockBtnBroadcast = document.getElementById('abort-lock-btn-broadcast');
const lockStatus = document.getElementById('lock-status');
const eventsLog = document.getElementById('events-log');
const releaseOnFreeze = document.getElementById('release-on-freeze');

acquireLockBtn.addEventListener('click', acquireLock);
acquireAutoreleaseLockBtn.addEventListener('click', onAcquire10sLock);
releaseLockBtn.addEventListener('click', releaseLock);
abortLockBtn.addEventListener('click', abortLock);
abortLockBtnBroadcast.addEventListener('click', broadcastAbort);
document.addEventListener('freeze', onFreeze);

// set title to the random 4 digit number
document.title = Math.floor(Math.random() * 10000) + ' - Web Locks API Playground';

const lockName = 'my-lock';
const abortChannel = new BroadcastChannel('abort-channel');

abortChannel.addEventListener('message', (e) => {
  log('Incoming abort broadcast, aborting lock');
  abortLock();
});

let lock = undefined;

function acquireLock() {
  if (lock) {
    log('Lock already acquired');
    return;
  }
  const abortController = new AbortController();
  lockStatus.textContent = 'Acquiring...';
  const deferred = makeDeferred();
  abortController.signal.addEventListener('abort', () => {
    deferred.reject();
  });
  navigator.locks
    .request(lockName, () => {
      lockStatus.textContent = 'Acquired';
      log('Lock acquired');
      lock = {
        release: () => {
          deferred.resolve();
        },
        abort: () => abortController.abort(),
      };
      return deferred.promise;
    })
    .catch((e) => {
      log('Error ' + e);
      console.error(e);
    })
    .finally(() => {
      log('Lock released');
      lockStatus.textContent = 'Released';
      lock = undefined;
    });
}

function onAcquireLock() {
  log('Acquiring lock');
  acquireLock();
}

function onAcquire10sLock() {
  log(
    `Acquiring 10s lock, releasing at ${new Date(Date.now() + 10000).toLocaleTimeString('en-US', {
      hour12: false,
    })}`
  );
  acquireLock();
  setTimeout(() => {
    if (lock) {
      log('Autoreleasing lock');
      lock.release();
    }
  }, 10000);
}

function releaseLock() {
  if (lock) {
    lock.release();
  }
}

function abortLock() {
  if (lock) {
    lock.abort();
  }
}

function broadcastAbort() {
  log('Broadcasting abort');
  abortChannel.postMessage('abort');
}

function onFreeze() {
  if (releaseOnFreeze.checked) {
    log('Freeze event, releasing lock');
    releaseLock();
  } else {
    log('Freeze event, but not releasing lock');
  }
}

function log(message) {
  eventsLog.textContent += message + '\n';
}

function makeDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}
