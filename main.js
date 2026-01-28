async function LoadData() {
  let res = await fetch("http://localhost:3000/posts");
  let posts = await res.json();
  let body = document.getElementById("body_table");
  body.innerHTML = "";
  for (const post of posts) {
    let rowClass = post.isDeleted ? 'class="strikethrough"' : "";
    body.innerHTML += `<tr ${rowClass}>
            <td>${post.id}</td>
            <td>${post.title}</td>
            <td>${post.views}</td>
           <td><input type="submit" value="Delete" onclick="Delete(${post.id})"/></td>
        </tr>`;
  }
  LoadComments();
}

async function LoadComments() {
  let res = await fetch("http://localhost:3000/comments");
  let comments = await res.json();
  let container = document.getElementById("comments_container");
  container.innerHTML = "";

  // Display each comment with its post info
  for (const comment of comments) {
    let commentClass = comment.isDeleted ? 'class="strikethrough"' : "";
    let commentDiv = document.createElement("div");
    commentDiv.className = "comment-item";
    commentDiv.innerHTML = `
      <div ${commentClass}>
        <strong>Post ID: ${comment.postId}</strong><br/>
        ${comment.text}
      </div>
      <button onclick="EditComment(${comment.postId})">Edit</button>
      <button onclick="DeleteComment(${comment.postId})">Delete</button>
    `;
    container.appendChild(commentDiv);
  }
}

async function Save() {
  let id = document.getElementById("id_txt").value;
  let title = document.getElementById("title_txt").value;
  let views = document.getElementById("view_txt").value;

  // Nếu ID trống, tính ID tự động = maxId + 1
  if (!id) {
    let res = await fetch("http://localhost:3000/posts");
    let posts = await res.json();
    let maxId = Math.max(...posts.map((p) => parseInt(p.id) || 0));
    id = String(maxId + 1);
    document.getElementById("id_txt").value = id;
  }

  let getItem = await fetch("http://localhost:3000/posts/" + id);
  if (getItem.ok) {
    // UPDATE
    let res = await fetch("http://localhost:3000/posts/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        views: views,
        isDeleted: false,
      }),
    });
    if (res.ok) {
      console.log("Update successful");
    }
  } else {
    // CREATE
    try {
      let res = await fetch("http://localhost:3000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          title: title,
          views: views,
          isDeleted: false,
        }),
      });
      if (res.ok) {
        console.log("Create successful");
        document.getElementById("id_txt").value = "";
        document.getElementById("title_txt").value = "";
        document.getElementById("view_txt").value = "";
      }
    } catch (error) {
      console.log(error);
    }
  }
  LoadData();
  return false;
}

async function Delete(id) {
  // SOFT DELETE: mark as deleted instead of removing
  let res = await fetch("http://localhost:3000/posts/" + id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isDeleted: true,
    }),
  });
  if (res.ok) {
    console.log("Delete successful");
  }
  LoadData();
  return false;
}

async function SaveComment() {
  let postId = document.getElementById("comment_postId").value;
  let text = document.getElementById("comment_txt").value;

  if (!postId || !text) {
    return false;
  }

  // Check if post exists
  let postRes = await fetch("http://localhost:3000/posts/" + postId);
  if (!postRes.ok) {
    return false;
  }

  // Check if comment already exists for this post
  let commentsRes = await fetch(
    "http://localhost:3000/comments?postId=" + postId,
  );
  let comments = await commentsRes.json();

  try {
    if (comments.length > 0) {
      // Update existing comment
      let commentId = comments[0].id;
      let updateRes = await fetch(
        "http://localhost:3000/comments/" + commentId,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            postId: postId,
            isDeleted: false,
          }),
        },
      );
      if (updateRes.ok) {
        console.log("Comment updated successfully");
      }
    } else {
      // Create new comment
      let createRes = await fetch("http://localhost:3000/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          postId: postId,
          isDeleted: false,
        }),
      });
      if (createRes.ok) {
        console.log("Comment created successfully");
      }
    }
    document.getElementById("comment_postId").value = "";
    document.getElementById("comment_txt").value = "";
  } catch (error) {
    console.log(error);
  }

  LoadComments();
  return false;
}

async function EditComment(postId) {
  // Fetch comment data using filter query
  let res = await fetch("http://localhost:3000/comments?postId=" + postId);
  let comments = await res.json();

  if (comments.length === 0) {
    return;
  }

  let comment = comments[0];
  let oldText = comment.text;

  let newText = prompt("Edit comment:", oldText);
  if (newText === null || newText.trim() === "") {
    return;
  }

  // UPDATE comment
  let updateRes = await fetch("http://localhost:3000/comments/" + comment.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: newText,
      postId: postId,
      isDeleted: false,
    }),
  });
  if (updateRes.ok) {
    console.log("Comment updated successfully");
  }
  LoadComments();
}

async function DeleteComment(postId) {
  // Find comment by postId using filter query
  let res = await fetch("http://localhost:3000/comments?postId=" + postId);
  let comments = await res.json();

  if (comments.length === 0) {
    return;
  }

  let comment = comments[0];

  // SOFT DELETE comment
  let deleteRes = await fetch("http://localhost:3000/comments/" + comment.id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isDeleted: true,
    }),
  });
  if (deleteRes.ok) {
    console.log("Comment deleted successfully");
  }
  LoadComments();
}

LoadData();
