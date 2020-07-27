(function () {
  /* global $, zxcvbn */
  /**
   * @see confirmDialogPlugin
   */
  function formSubmit ($form, oEvent, options) {
    var defaults = {
      title: 'Confirm',
      body: 'Are you sure?',
      buttonClass: 'btn-primary',
      buttonText: 'Confirm',
      confirmPassword: false
    }
    var s = $.extend({}, defaults, options)
    var $target = $form ? $form.data('clicked') : null
    if ($form) {
      $form.data('clicked', null)
      if ($form.find('.confirmTempInput').length) {
        return
      }
    }
    if (oEvent) {
      oEvent.preventDefault()
    }
    Object.keys(s)
      .filter(function (k) {
        return k !== 'success'
      })
      .map(function (k) {
        s[k] = typeof s[k] === 'function' ? s[k]($target) : s[k]
      })
    $('#confirm-title').html(s.title)
    $('#confirm-body').html(s.body)
    var $confirmButton = $('#confirm-button')
      .html(s.buttonText)
      .addClass(s.buttonClass)
    if (s.width) {
      $('#confirm-modal .modal-dialog').css('width', s.width)
    }
    $('#confirm-modal form').off('.confirmModal')
    $('#confirm-modal form').on('submit.confirmModal', function (event) {
      event.preventDefault()
      if ($form) {
        $form.find('.confirmTempInput').remove()
        if (s.confirmPassword) {
          var name =
            typeof s.confirmPassword === 'string'
              ? s.confirmPassword
              : 'password'
          $('<input>')
            .attr({
              type: 'hidden',
              class: 'confirmTempInput',
              name: name,
              value: $('#pwd-confirm').val()
            })
            .appendTo($form)
        }
        $('<input>')
          .attr({
            type: 'hidden',
            class: 'confirmTempInput',
            id: 'confirmDialogConfirmed'
          })
          .appendTo($form)
      }
      $(event.target).removeClass(s.buttonClass)
      $('#confirm-modal').modal('hide')
      if (s.success) {
        s.success(oEvent, $target ? $target[0] : oEvent ? oEvent.target : null)
      } else if ($target) {
        showLoader()
        $target.click()
      } else if ($form) {
        showLoader()
        $form.submit()
      }
      if ($form) {
        $form.find('.confirmTempInput').remove()
      }
    })
    $('#pwd-confirm-form').toggle(s.confirmPassword)
    $('#pwd-confirm')
      .prop('disabled', !s.confirmPassword)
      .prop('required', s.confirmPassword)
    $('#confirm-modal').on('shown.bs.modal', function () {
      $confirmButton.focus()
    })
    $('#confirm-modal').modal('show')
    return $('#confirm-modal')
  }
  window.formSubmit = formSubmit

  /**
   * Confirm a action with a dialog. Optionally by confirming with password.
   * Body can be html. All options can be functions
   * @param  Object options (title, body, buttonClass, buttonText, confirmPassword)
   */
  function confirmDialogPlugin (options) {
    $(this).each(function () {
      var $form = $(this)
      $form.on('click.confirmDialogPlugin', ':submit', function (event) {
        $form.data('clicked', $(event.target))
      })
      var id = $form.attr('id')
      if (id) {
        $form.on('click.confirmDialogPlugin', 'button[form=' + id + ']', function (
          event
        ) {
          $form.data('clicked', $(event.target))
        })
      }
      $form.on('submit.confirmDialogPlugin', function (event) {
        return formSubmit($form, event, options)
      })
    })
  }
  $.fn.confirmDialog = confirmDialogPlugin

  /**
   * Confirm a action with a dialog.
   * Body can be html. All options can be functions.
   * @param Function callback, called if confirmed
   * @param Object options (title, body, buttonClass, buttonText, success)
   */
  function confirmDialog (callback, options) {
    options = options || {}
    options.success = callback || function () { }
    return formSubmit(null, null, options)
  }
  window.confirmDialog = confirmDialog

  var requests = {}
  function httpRequest (verb, url) {
    var form = $('<form method="post" />').appendTo(document.body)
    form.attr('action', url)
    form.append(
      '<input type="hidden" name="_method" value="' +
      verb.toUpperCase() +
      '" />'
    )
    form.submit()
  }
  requests.delete = function httpDeleteRequest (url) {
    httpRequest('delete', url)
  }
  window.httpRequest = requests
  /**
   * Renders form feedback or triggers a flash message
   * @param jqObject $form
   * @param Object i Required fields message (string) and type (error, warn, info, success)
   *                 Optional field field (name of form field to render feedback to)
   */
  function renderFeedback ($form, i) {
    if (i.field) {
      var type = ['warn', 'info'].includes(i.type) ? 'warning' : i.type
      var classes = 'has-' + type
      var $input = $form.find('[name=' + i.field.replace(/(\[|\])/g, '\\$1') + ']')
      var $fg = $input.closest('.form-group')
      $fg.addClass(classes)
      $input
        .closest('div:not(.input-group)')
        .append(
          '<span class="help-block form-feedback">' + i.message + '</span>'
        )
      $fg.addClass('has-error has-feedback')
      $input.off('keyup change', clearFeedback)
      if (i.clearFeedbackOnChange !== false) {
        $input.on('keyup change', clearFeedback)
      }
      if (i.value) {
        $input.val(i.value)
      }
    } else {
      flashNotify({ type: i.type, message: i.message, title: i.type })
    }
  }
  window.renderFeedback = renderFeedback

  function renderFeedbacks ($form, $dataFields) {
    $dataFields.each(function (i, f) {
      var fieldData = JSON.parse(f.dataset.feedback)
      renderFeedback($form, fieldData)
    })
  }
  window.renderFeedbacks = renderFeedbacks

  /**
   * Handle text and json responses
   * @param jqObject $form
   * @param jgXHR xhr
   */
  function handleResponse ($form, xhr) {
    var ct = xhr.getResponseHeader('content-type') || ''
    if (ct.indexOf('html') > -1) {
      $('body').append(xhr.responseText)
    }
    if (ct.indexOf('json') > -1) {
      var data = xhr.responseJSON
      if (Array.isArray(data)) {
        data.forEach(function (i) {
          renderFeedback($form, i)
        })
      } else if (data) {
        renderFeedback($form, data)
      }
    }
  }

  function clearFeedback (e) {
    const $input = $(e.currentTarget)
    const $fg = $(e.currentTarget).closest('.form-group')
    $fg.removeClass('has-success has-error has-warning has-feedback')
    $fg.find('.form-feedback').remove()
    $input.off('keyup change', clearFeedback)
  }
  window.clearFeedback = clearFeedback

  /**
   * Post parent form. Handles both text and json responses. Text response is appended to body.
   * Json responses can be Object with properties type, message and field. Or Array of such objects.
   * @see handleJSONResponse
   * @param Event event
   */
  function ajaxPostForm (event) {
    var $input = $(event.target)
    var $form = $input.closest('form')
    $('.flash-data').remove()
    if (!$form[0].checkValidity()) {
      // If the form is invalid, submit it. The form won't actually submit;
      // this will just cause the browser to display the native HTML5 error messages.
      $input.trigger('post-fail')
      // All forms don't have a submit button so we fake one, wait for any focus events to exectue
      setTimeout(function () {
        $('<input type="submit">').hide().appendTo($form).click().remove()
      }, 200)
      return { done: () => { }, fail: () => { }, always: () => { } } // Dummy promise
    }
    clearFeedback($form)
    var formdata = $form.serialize()
    if ($input.is('button')) {
      // add the clicked button to the form data
      if ($input.attr('name')) {
        formdata += formdata !== '' ? '&' : ''
        formdata += $input.attr('name') + '=' + $input.val()
      }
    }
    return $.post($form.attr('action'), formdata)
      .done(function (response, status, xhr) {
        handleResponse($form, xhr)
      })
      .fail(function (xhr, status, responseText) {
        handleResponse($form, xhr)
        $input.trigger('post-fail', xhr)
      })
  }
  window.ajaxPostForm = ajaxPostForm

  /**
   * Triggers bootstrap notify
   * @param Object options (type, message, title)
   */
  function flashNotify (options) {
    // jshint -W116
    if (options == null || window.blockNotify) {
      return
    }
    var type = options.type ? options.type.toLowerCase() : 'info'
    type = type === 'error' ? 'danger' : type
    var icon
    if (type === 'danger') {
      icon = 'octicon octicon-stop'
    } else if (type === 'warning') {
      icon = 'octicon octicon-alert'
    } else if (type === 'success') {
      icon = 'octicon octicon-check'
    } else {
      icon = 'octicon octicon-info'
    }
    $.notify(
      {
        title: options.title,
        message: options.message,
        icon: icon,
        icon_type: 'class'
      },
      {
        type: type,
        allow_dismiss: true,
        newest_on_top: true,
        placement: {
          from: 'top',
          align: 'right'
        },
        offset: 0,
        spacing: 10,
        delay: 7000,
        mouse_over: 'pause',
        animate: {
          enter: 'animated fadeIn',
          exit: 'animated fadeOut'
        },
        element: '#notifications'
      }
    )
  }
  window.flashNotify = flashNotify

  /**
   * Make element dependent on another (or multiple) to be activated. Use by setting data-{type}
   * attribute on a form field to name of dependent field. Can be space separated list.
   * Can be negated by prepending name with !
   * @param string type (disabled, readonly, hide)
   */
  function dataRequired (type) {
    var $dependant = $(this)
    var dataRequired = $dependant.data(type).split(' ')
    var depSelector = dataRequired
      .map(function (n) {
        return '[name=' + n.replace(/^!/, '') + ']'
      })
      .join()
    var negated = dataRequired
      .filter(function (s) {
        return /^!/.test(s)
      })
      .map(function (n) {
        return n.replace(/^!/, '')
      })
    var $dependencies = $dependant.closest('form').find(depSelector)
    var toggle = function () {
      var change = {}
      var enable = $dependencies.toArray().every(function (dep) {
        var val = dep.value
        if (['checkbox', 'radio'].indexOf(dep.type) !== -1) {
          val = dep.checked
        }
        return negated.indexOf(dep.name) !== -1 ? !val : val
      })
      if ($dependant.is('select') && type === 'readonly') {
        $dependant.find('option:not(:selected)').prop('disabled', !enable)
      } else if (type === 'hide') {
        $dependant.toggle(!enable)
      } else {
        $dependant.prop(type, !enable)
      }
      change[type] = !enable
      $dependant.trigger('attr-change', change)
    }
    $dependencies.on('keyup change click', toggle)
    $dependant.on('keyup change click', toggle)
    toggle()
  }

  function showLoader (e) {
    if (e && (e.ctrlKey || e.shiftKey || e.metaKey || e.which === 2)) {
      // ctrl/cmd click
      return
    }
    setTimeout(function () {
      $('<div class="loader loader-full">').appendTo($('.loader-wrapper'))
    }, 10)
  }
  window.showLoader = showLoader

  /**
 * Confirm a action with a dialog. Optionally by confirming with password.
 * Body can be html. All options can be functions
 * @param  Object options (title, body, buttonClass, buttonText, confirmPassword)
 */
  function passwordStrengthPlugin (options) {
    $(this).each(function () {
      const $pwdField = $(this)
      const $form = $pwdField.closest('form')
      const $email = $form.find('input[name=email]')
      const $parent = $pwdField.parent()
      $parent.append("<div class='progress password-strength hide'><div class='progress-bar'></div></div>")
      $pwdField.on('keyup', e => {
        const $progress = $form.find('.progress')
        const $progressBar = $progress.find('.progress-bar')
        const result = zxcvbn(e.currentTarget.value, [$email.val()])
        let score = result.score
        let errors = []
        if (result.feedback.warning) {
          errors.push(result.feedback.warning)
        }
        if (score < 3) {
          errors = errors.concat(result.feedback.suggestions)
        }
        clearFeedback(e)
        if (!e.currentTarget.value) {
          errors = []
          score = -1
          $progress.addClass('hide')
        } else {
          $progress.removeClass('hide')
        }
        errors.forEach(e => {
          renderFeedback($form, {
            field: $pwdField.attr('name'),
            message: e,
            type: 'error',
            clearFeedbackOnChange: false
          })
        })
        $progress.attr('value', result.score)
        $progressBar.attr('class', 'progress-bar')
        const percent = ((score + 1) / 5) * 100
        $progressBar.css('width', percent + '%')
        if (score < 2) {
          $progressBar.addClass('progress-bar-danger')
        } else if (result.score < 4) {
          $progressBar.addClass('progress-bar-warning')
        } else {
          $progressBar.addClass('progress-bar-success')
        }
      })
    })
  }
  $.fn.passwordStrength = passwordStrengthPlugin

  window.progressModal = function (title, opts) {
    opts = Object.assign(
      {
        onClose: function () { },
        items: 1
      },
      opts || {}
    )

    var rowTpl = '<li class="row"></li>'
    var stateClassMap = {
      running: 'info',
      done: 'success',
      error: 'danger'
    }
    var $modal = $('#progressModal')
    var $title = $modal.find('.modal-title')
    var $progressBar = $modal.find('.progress-bar')
    var $footer = $modal.find('.modal-footer')
    var $closeBtn = $footer.find('button')
    var $rows = $modal.find('.modal-body .rows')
    var itemsDone = 0
    var itemsAdded = 0

    var updateProgress = function () {
      setPercentage(Math.round(itemsDone / opts.items * 100))
    }
    var itemDone = function () {
      ++itemsDone
      updateProgress()
    }
    var itemAdded = function () {
      opts.items = Math.max(++itemsAdded, opts.items)
      updateProgress()
    }
    var setTitle = function (txt) {
      $title.text(txt)
    }
    var setPercentage = function (p) {
      var val = p.toString() + '%'
      $progressBar.width(val).text(val)
    }
    $modal.on('hide.bs.modal', function () {
      opts.onClose()
    })
    var done = function () {
      $closeBtn.prop('disabled', false)
    }
    var addRow = function (txt) {
      var state = 'running'
      var $row = $(rowTpl)
        .appendTo($rows)
        .hide()
        .addClass('alert-' + stateClassMap[state])
        .text(txt)
        .fadeIn()
      $rows.animate({ scrollTop: $rows.height() }, 20)

      var setState = function (newState) {
        if (state !== 'running') {
          throw new Error(
            "Can't change state from " + state + ' to ' + newState
          )
        } else if (['done', 'error'].indexOf(newState) > -1) {
          itemDone()
        }
        $row
          .removeClass('alert-' + stateClassMap[state])
          .addClass('alert-' + stateClassMap[newState])
        state = newState
        return row
      }
      var setText = function (txt) {
        $row.text(txt)
        return row
      }
      var destroy = function () {
        $row.remove()
      }
      var row = {
        setText: setText,
        setState: setState,
        destroy: destroy
      }
      itemAdded()
      return row
    }
    var modal = {
      setTitle: setTitle,
      addRow: addRow,
      done: done
    }
    modal.setTitle(title)
    updateProgress()
    $modal.modal({ keyboard: false })
    $modal.modal('show')
    return modal
  }

  var feedbackEventListeners = {}
  function registerFeedbackListener (rk, callback) {
    feedbackEventListeners[rk] = feedbackEventListeners[rk] || []
    feedbackEventListeners[rk].push(callback)
  }

  function bootstrapFeedback (url) {
    var feedbackEvents = new window.EventSource(url)

    window.addEventListener('beforeunload', function (e) {
      feedbackEvents.close()
    })

    feedbackEvents.onopen = function (e) {
      console.log(e)
    }

    feedbackEvents.onerror = function (e) {
      console.error(e)
      feedbackEvents.close()
    }

    feedbackEvents.onmessage = function (e) {
      var data = JSON.parse(e.data)
      var listeners = feedbackEventListeners[data.routing_key]
      if (listeners) {
        listeners.forEach(function (listener) {
          listener(data)
        })
      }
      flashNotify(data)
    }
  }

  window.feedback = {
    bootstrap: bootstrapFeedback,
    registerListener: registerFeedbackListener
  }

  window.show = function (e) {
    e.style.display = 'block'
  }

  window.hide = function (e) {
    e.style.display = 'none'
  }

  // Ready
  // Connect an input checkbox to a group of checkboxes to de-/select all
  $(function () {
    $('input[type=checkbox][data-select-all]').each(function () {
      var $selectAll = $(this)
      var $checkboxes = $(
        'input[name="' + $selectAll.data('select-all') + '"]'
      )
      $selectAll.click(function () {
        $checkboxes
          .prop('checked', $selectAll.is(':checked'))
          .trigger('change')
      })
      $checkboxes.click(function () {
        $selectAll.prop(
          'checked',
          $checkboxes.filter(':checked').length === $checkboxes.length
        )
      })
    })

    $('input[data-enable-if-one], button[data-enable-if-one]').each(function () {
      var $input = $(this)
      var $dependsOn = $('input[name="' + $input.data('enable-if-one') + '"]')
      var updateState = function () {
        $input.prop('disabled', $dependsOn.filter(':checked').length !== 1)
      }
      $dependsOn.change(updateState)
      updateState()
    })
    $('input[data-enable-if-any], button[data-enable-if-any]').each(function () {
      var $input = $(this)
      var $dependsOn = $('input[name="' + $input.data('enable-if-any') + '"]')
      var updateState = function () {
        $input.prop('disabled', $dependsOn.filter(':checked').length === 0)
      }
      $dependsOn.change(updateState)
      updateState()
    })

    var $notifications = $('#notifications')
    var $switches = $('input.switch')

    // make table rows etc. clickable with data-href attribute
    $('[data-href]').on('click', function (e) {
      var target = e.target
      while (target !== this) {
        if (
          target.tagName === 'INPUT' ||
          typeof target.dataset.hrefExclude !== 'undefined'
        ) {
          return true
        }
        target = target.parentNode
      }
      var url = $(this).data('href')
      if (window.getSelection().toString().length > 0) {
        return false
      }
      if (e.ctrlKey || e.shiftKey || e.metaKey || e.which === 2) {
        // ctrl/cmd click
        var win = window.open(url, '_blank')
        win.focus()
      } else {
        window.document.location = url
      }
      return false
    })

    $('[data-disabled]').each(function () {
      dataRequired.call(this, 'disabled')
    })
    $('[data-readonly]').each(function () {
      dataRequired.call(this, 'readonly')
    })
    $('[data-hide]').each(function () {
      dataRequired.call(this, 'hide')
    })

    // init switches
    try {
      $switches.bootstrapSwitch({
        onInit: function (event) {
          var $el = $(event.target)
          $el.closest('.bootstrap-switch').attr('title', $el.attr('title'))
        }
      })
    } catch (err) {
      console.warn('BS switches not loaded')
    }

    // init ajax switches
    $switches
      .filter('.post')
      .on('switchChange.bootstrapSwitch', ajaxPostForm)
      .on('post-fail', function () {
        $(this).bootstrapSwitch('toggleState', true)
        $(this).trigger('change')
      })
    $switches.on('switchChange.bootstrapSwitch', function (e) {
      $(e.target).trigger('change', e)
    })
    // make switches aware of attribute changes
    $switches.on('attr-change', function (e, data) {
      Object.keys(data).forEach(function (k) {
        var $input = $(e.target)
        // always allow switches to be unchecked
        if (k === 'disabled' && $input.is(':checked')) {
          $input.prop('disabled', false)
          $input.bootstrapSwitch('disabled', false)
        } else {
          $input.bootstrapSwitch(k, data[k])
        }
        if (k === 'hide') {
          $input.closest('.bootstrap-switch-wrapper').toggle(data[k])
        }
      })
    })

    // notifications follow page scroll
    $notifications.affix({ offset: { top: $notifications.offset().top - 10 } })

    // init page loader links
    $('.loader-link').on('click', showLoader)

    // stop propagation from links i data-href
    $('a, button, input[type="button"]', '[data-href]').on('click', function (
      e
    ) {
      var $target = $(this)
      e.stopPropagation()
      if ($target.is('.dropdown-toggle, .dropdown-menu li a')) {
        $target.closest('.dropdown').toggleClass('open')
      }
    })
  })

  // critical support
  $(_ => {
    if (window.currentInstance) {
      $('a[data-critical-support]').each((_i, btn) => {
        const $btn = $(btn)
        let href = $btn.attr('href')
        href = href.replace(/subject=([^&]*)/, "subject=$1 [" +
          window.currentInstance.name + " / " + window.currentInstance.accountName + "]")
        $btn.attr('href', href)
      })
    }
  })

})()
