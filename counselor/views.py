from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout


@csrf_exempt
def register(request):
    if request.method == 'POST':
        username = request.POST['username']
        fname = request.POST['fname']
        lname = request.POST['lname']
        email = request.POST['email']
        pass1 = request.POST['pass1']
        pass2 = request.POST['pass2']

        if len(username) > 10:
            return HttpResponse("Username must be under 10 characters")

        if not username.isalnum():
            return HttpResponse("Username should contains letters and numbers")

        if pass1 != pass2:
            return HttpResponse("Passwords do not match")

        myuser = User.objects.create_user(username, email, pass1)
        myuser.first_name = fname
        myuser.last_name = lname
        myuser.save()
        return HttpResponse("User registered successfully")
    else:
        return HttpResponse(status=404)


@csrf_exempt
def handleLogin(request):
    if request.method == 'POST':
        loginusername = request.POST['loginusername']
        loginpassword = request.POST['loginpassword']

        user = authenticate(username=loginusername, password=loginpassword)

        if user is not None:
            login(request, user)
            return HttpResponse("Logged in successfully")
        else:
            return HttpResponse("Invalid credentials")


@csrf_exempt
def handleLogout(request):
    logout(request)
    return HttpResponse("Logged out successfully")
