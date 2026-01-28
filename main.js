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

  // Group comments by postId
  let commentsByPost = {};
  for (const comment of comments) {
    if (!commentsByPost[comment.postId]) {
      commentsByPost[comment.postId] = [];
    }
    commentsByPost[comment.postId].push(comment);
  }

  // Display comments grouped by post
  for (const postId in commentsByPost) {
    let section = document.createElement("div");
    section.className = "comment-section";
    section.innerHTML = `<h3>Comments for Post ${postId}</h3>`;

    for (const comment of commentsByPost[postId]) {
      let commentClass = comment.isDeleted ? 'class="strikethrough"' : "";
      let commentDiv = document.createElement("div");
      commentDiv.className = "comment-item";
      commentDiv.innerHTML = `
        <div ${commentClass}>
          <strong>Comment ID: ${comment.id}</strong><br/>
          ${comment.text}
        </div>
        <button onclick="EditComment(${comment.id}, ${postId})">Edit</button>
        <button onclick="DeleteComment(${comment.id})">Delete</button>
      `;
      section.appendChild(commentDiv);
    }
    container.appendChild(section);
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

  // Get max comment ID
  let res = await fetch("http://localhost:3000/comments");
  let comments = await res.json();
  let maxId =
    comments.length > 0
      ? Math.max(...comments.map((c) => parseInt(c.id) || 0))
      : 0;
  let newId = String(maxId + 1);

  // CREATE new comment
  try {
    let createRes = await fetch("http://localhost:3000/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: newId,
        text: text,
        postId: postId,
        isDeleted: false,
      }),
    });
    if (createRes.ok) {
      console.log("Comment created successfully");
      document.getElementById("comment_postId").value = "";
      document.getElementById("comment_txt").value = "";
    }
  } catch (error) {
    console.log(error);
  }

  LoadComments();
  return false;
}

async function EditComment(commentId, postId) {
  // Fetch comment data to get current text
  let res = await fetch("http://localhost:3000/comments/" + commentId);
  let comment = await res.json();
  let oldText = comment.text;

  let newText = prompt("Edit comment:", oldText);
  if (newText === null || newText.trim() === "") {
    return;
  }

  // UPDATE comment
  let updateRes = await fetch("http://localhost:3000/comments/" + commentId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: commentId,
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

async function DeleteComment(commentId) {
  // SOFT DELETE comment
  let res = await fetch("http://localhost:3000/comments/" + commentId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isDeleted: true,
    }),
  });
  if (res.ok) {
    console.log("Comment deleted successfully");
  }
  LoadComments();
}

LoadData();
